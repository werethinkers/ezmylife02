# Gives a TestFlight build to every tester group, so testers other than the account owner get each build.
#
#   ruby ios/testflight-share.rb <key.p8> [build number]
#
# Needs ASC_KEY_ID and ASC_ISSUER_ID in the environment (the same App Store Connect key the upload uses).
# Without a build number it takes the newest build. It waits for Apple to finish processing the build, then:
#   - internal groups (people on the App Store Connect team) that don't already get every build: adds the build;
#   - external groups (testers invited by email or public link): adds the build, sets "What to Test" and
#     sends it to Beta App Review (Apple checks the first build of a version; later ones usually pass at once).
# Used by .github/workflows/ios-testflight.yml after each upload, and by its "share only" run.
require "openssl"
require "json"
require "base64"
require "net/http"
require "uri"
$stdout.sync = true

KEY_PATH = ARGV[0] or abort("usage: testflight-share.rb <key.p8> [build number]")
BUILD_NUMBER = ARGV[1].to_s.strip.sub(/\Anewest\z/, "")
BUNDLE_ID = ENV.fetch("BUNDLE_ID", "com.ezyourlife.app")
WHATS_NEW = ENV.fetch("WHATS_NEW", "New EZYOURLIFE keyboard build. Type / in any app to try the apps and shortcuts.")

def token
  key = OpenSSL::PKey.read(File.read(KEY_PATH))
  b64 = ->(s) { Base64.urlsafe_encode64(s, padding: false) }
  head = b64.(JSON.generate(alg: "ES256", kid: ENV.fetch("ASC_KEY_ID"), typ: "JWT"))
  body = b64.(JSON.generate(iss: ENV.fetch("ASC_ISSUER_ID"), iat: Time.now.to_i, exp: Time.now.to_i + 900, aud: "appstoreconnect-v1"))
  der = key.sign(OpenSSL::Digest::SHA256.new, "#{head}.#{body}")
  sig = OpenSSL::ASN1.decode(der).value.map { |i| i.value.to_s(2).rjust(32, "\x00")[-32..] }.join
  "#{head}.#{body}.#{b64.(sig)}"
end

def api(method, path, body = nil)
  uri = URI("https://api.appstoreconnect.apple.com#{path}")
  req = { "GET" => Net::HTTP::Get, "POST" => Net::HTTP::Post, "PATCH" => Net::HTTP::Patch }.fetch(method).new(uri)
  req["Authorization"] = "Bearer #{token}"
  req["Content-Type"] = "application/json"
  req.body = JSON.generate(body) if body
  res = Net::HTTP.start(uri.host, uri.port, use_ssl: true) { |h| h.request(req) }
  data = res.body.to_s.empty? ? {} : JSON.parse(res.body)
  [res.code.to_i, data]
end

def errors(data)
  (data["errors"] || []).map { |e| [e["title"], e["detail"]].compact.join(": ") }.join("; ")
end

code, apps = api("GET", "/v1/apps?filter[bundleId]=#{BUNDLE_ID}")
app = apps["data"]&.first or abort("No app with bundle id #{BUNDLE_ID} (#{code}): #{errors(apps)}")
app_id = app["id"]

# Wait (up to 40 minutes) for the build to appear and finish processing.
build = nil
80.times do
  query = BUILD_NUMBER.empty? ? "sort=-uploadedDate&limit=1" : "filter[version]=#{BUILD_NUMBER}&limit=1"
  code, builds = api("GET", "/v1/builds?filter[app]=#{app_id}&#{query}")
  abort("App Store Connect refused the build list (#{code}): #{errors(builds)}") if code >= 400
  build = builds["data"]&.first
  state = build && build.dig("attributes", "processingState")
  puts "Build #{build&.dig("attributes", "version") || BUILD_NUMBER}: #{state || "not in App Store Connect yet"}"
  $stdout.flush
  break if state == "VALID"
  abort("Apple could not process the build (#{state}).") if %w[FAILED INVALID].include?(state)
  sleep 30
end
abort("The build was still processing after 40 minutes. Run the share step again later.") unless build&.dig("attributes", "processingState") == "VALID"
build_id = build["id"]
number = build.dig("attributes", "version")

# Export compliance (Info.plist says ITSAppUsesNonExemptEncryption = NO; set it here too in case Apple asks).
if build.dig("attributes", "usesNonExemptEncryption").nil?
  api("PATCH", "/v1/builds/#{build_id}", { data: { type: "builds", id: build_id, attributes: { usesNonExemptEncryption: false } } })
end

_, groups = api("GET", "/v1/betaGroups?filter[app]=#{app_id}&limit=200")
list = groups["data"] || []

# PUBLIC_LINK=1: make sure an outside-tester group with a join link exists (anyone with the link can join).
if ENV["PUBLIC_LINK"] == "1" && list.none? { |g| !g.dig("attributes", "isInternalGroup") && g.dig("attributes", "publicLinkEnabled") }
  code, made = api("POST", "/v1/betaGroups", {
    data: { type: "betaGroups",
            attributes: { name: "EZYOURLIFE testers", publicLinkEnabled: true, publicLinkLimitEnabled: true, publicLinkLimit: 1000, feedbackEnabled: true },
            relationships: { app: { data: { type: "apps", id: app_id } } } },
  })
  if code < 300
    puts "Made the outside-tester group \"EZYOURLIFE testers\" with a join link."
    list << made["data"]
  else
    puts "::warning::Could not make the outside-tester group (#{code}): #{errors(made)}"
  end
end
list.each do |g|
  link = g.dig("attributes", "publicLink")
  puts "Join link for #{g.dig("attributes", "name")}: #{link}" if link
end
puts "Tester groups: #{list.empty? ? "none" : list.map { |g| g.dig("attributes", "name") }.join(", ")}"
puts "No tester groups yet: make one in App Store Connect → TestFlight and add the testers." if list.empty?

external = false
list.each do |g|
  name = g.dig("attributes", "name")
  internal = g.dig("attributes", "isInternalGroup")
  # Who is in the group and whether they accepted (emails masked in the log).
  _, people = api("GET", "/v1/betaGroups/#{g["id"]}/betaTesters?limit=200&fields[betaTesters]=email,inviteType,state")
  (people["data"] || []).each do |t|
    email = t.dig("attributes", "email").to_s
    masked = email.sub(/\A(.).*(.@)/, '\\1***\\2')
    puts "    tester #{masked}: #{t.dig("attributes", "state") || "?"} (#{t.dig("attributes", "inviteType") || "?"})"
  end
  if internal && g.dig("attributes", "hasAccessToAllBuilds")
    puts "  #{name} (internal): already gets every build"
    next
  end
  code, data = api("POST", "/v1/betaGroups/#{g["id"]}/relationships/builds", { data: [{ type: "builds", id: build_id }] })
  puts "  #{name} (#{internal ? "internal" : "external"}): #{code < 300 ? "build #{number} added" : "could not add (#{code}) #{errors(data)}"}"
  external ||= !internal
end

if external
  _, locs = api("GET", "/v1/builds/#{build_id}/betaBuildLocalizations")
  if (locs["data"] || []).empty?
    api("POST", "/v1/betaBuildLocalizations", {
      data: { type: "betaBuildLocalizations", attributes: { locale: "en-US", whatsNew: WHATS_NEW },
              relationships: { build: { data: { type: "builds", id: build_id } } } },
    })
  end
  code, data = api("POST", "/v1/betaAppReviewSubmissions", {
    data: { type: "betaAppReviewSubmissions", relationships: { build: { data: { type: "builds", id: build_id } } } },
  })
  if code < 300
    puts "Sent build #{number} to Beta App Review for external testers."
  elsif errors(data) =~ /already|ANOTHER_BUILD_IN_REVIEW|state/i
    puts "Beta App Review: #{errors(data)}"
  else
    puts "::warning::Beta App Review refused (#{code}): #{errors(data)}. Fill Test Information (contact, sign-in details) in App Store Connect → TestFlight, then run the share step again."
  end
end
