"use client";

import { useState } from "react";
import { loginAction } from "@/actions/login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Lock, Mail, Shield, ArrowRight, Building2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await loginAction(formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    }
  }

  const features = [
    { title: "Enterprise Grade Security", desc: "SSO and multi-factor authentication ready." },
    { title: "Global Goal Alignment", desc: "Align individual targets with organizational KPIs." },
    { title: "Real-time Analytics", desc: "Performance insights across every department." }
  ];

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-white overflow-hidden">
      {/* Left Section: Branding & Value Prop */}
      <div className="hidden md:flex w-1/2 bg-slate-900 relative p-12 flex-col justify-between text-white overflow-hidden">
        {/* Decorative Patterns */}
        <div className="absolute inset-0 enterprise-grid opacity-10 pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-2 mb-12">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">AtomQuest</span>
          </div>

          <h2 className="text-5xl font-bold leading-tight mb-6">
            Enterprise Goal <br />
            <span className="text-blue-400">Management Reimagined.</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-lg mb-12">
            The unified platform for Fortune 500 companies to orchestrate strategy, 
            align teams, and drive measurable performance outcomes.
          </p>

          <div className="space-y-6">
            {features.map((feature, i) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                className="flex items-start gap-4"
              >
                <div className="mt-1 bg-white/10 p-1 rounded">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold">{feature.title}</h4>
                  <p className="text-sm text-slate-400">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 flex items-center gap-8 text-sm text-slate-500"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>Trusted by 500+ Enterprises</span>
          </div>
          <span>&copy; 2026 AtomQuest Systems Inc.</span>
        </motion.div>
      </div>

      {/* Right Section: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 relative">
        <div className="absolute inset-0 enterprise-dots opacity-40 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[440px] relative z-10"
        >
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Shield className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">AtomQuest</span>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 p-10">
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Sign in to Portal</h1>
              <p className="text-slate-500">Access your executive dashboard and team KPIs.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">Work Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@company.com"
                    required
                    className="pl-11 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" dangerouslySetInnerHTML={{ __html: 'Password' }} className="text-slate-700 font-medium" />
                  <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Forgot?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="pl-11 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 group" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign in to Account
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Enterprise Demo Accounts</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { role: "ADMIN", email: "admin@atomquest.dev" },
                  { role: "MANAGER", email: "marcus.t@atomquest.dev" },
                  { role: "EMPLOYEE", email: "alex.r@atomquest.dev" }
                ].map((demo) => (
                  <button
                    key={demo.role}
                    type="button"
                    onClick={() => {
                      const emailInput = document.getElementById('email') as HTMLInputElement;
                      const passInput = document.getElementById('password') as HTMLInputElement;
                      if (emailInput && passInput) {
                        emailInput.value = demo.email;
                        passInput.value = "Password123";
                      }
                    }}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">{demo.role}</span>
                      <span className="text-[10px] text-slate-500">{demo.email}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <p className="mt-8 text-center text-sm text-slate-500">
            Secure login with industry-standard encryption. <br />
            Need help? <a href="#" className="font-semibold text-blue-600 underline underline-offset-4">Contact IT Support</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
