import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/supabase";
import { Menu, X, User, LogOut, Crown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

export const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await authService.signOut();
    navigate("/");
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/tools", label: "Tools" },
    { to: "/notebook", label: "Notebook" },
    { to: "/subscription", label: "Pricing" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  const premiumLinks = user
    ? [{ to: "/get-extension", label: "Get Extension" }]
    : [];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <motion.img
              src={logo}
              alt="EZYOURLIFE"
              className="h-8 md:h-10 object-contain"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            />
          </Link>

           {/* Desktop Navigation */}
           <div className="hidden md:flex items-center gap-8">
             {navLinks.map((link, index) => (
               <motion.div
                 key={link.to}
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
               >
                 <Link
                   to={link.to}
                   className="relative text-sm text-muted-foreground hover:text-foreground transition-colors group"
                 >
                   {link.label}
                   <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                 </Link>
               </motion.div>
             ))}
             {premiumLinks.map((link, index) => (
               <motion.div
                 key={link.to}
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.1 + (navLinks.length + index) * 0.05, duration: 0.3 }}
               >
                 <Link
                   to={link.to}
                   className="relative text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
                 >
                   {link.label}
                   <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                 </Link>
               </motion.div>
             ))}
           </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                          {getInitials(user.email || "U")}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Manage your account</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/subscription" className="cursor-pointer">
                      <Crown className="mr-2 h-4 w-4" />
                      Subscription
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="flex items-center gap-3"
              >
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button asChild>
                    <Link to="/auth">Get Started</Link>
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* Mobile Menu Button */}
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden border-t border-border overflow-hidden"
            >
               <div className="py-4 space-y-1">
                 {navLinks.map((link, index) => (
                   <motion.div
                     key={link.to}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: index * 0.05, duration: 0.3 }}
                   >
                     <Link
                       to={link.to}
                       className="block py-3 px-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all"
                       onClick={() => setMobileMenuOpen(false)}
                     >
                       {link.label}
                     </Link>
                   </motion.div>
                 ))}
                 {premiumLinks.map((link, index) => (
                   <motion.div
                     key={link.to}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: (navLinks.length + index) * 0.05, duration: 0.3 }}
                   >
                     <Link
                       to={link.to}
                       className="block py-3 px-2 text-primary font-medium hover:text-primary/80 hover:bg-accent/50 rounded-lg transition-all"
                       onClick={() => setMobileMenuOpen(false)}
                     >
                       {link.label}
                     </Link>
                   </motion.div>
                 ))}
                 {!user && (
                   <motion.div
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: navLinks.length * 0.05, duration: 0.3 }}
                   >
                     <Link
                       to="/auth"
                       className="block py-3 px-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all sm:hidden"
                       onClick={() => setMobileMenuOpen(false)}
                     >
                       Sign In
                     </Link>
                   </motion.div>
                 )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};
