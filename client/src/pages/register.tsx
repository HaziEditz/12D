import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Loader2, Eye, EyeOff, GraduationCap, CreditCard } from "lucide-react";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTeacherPopup, setShowTeacherPopup] = useState(false);
  const [pendingTeacherData, setPendingTeacherData] = useState<RegisterInput | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      role: "student",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    if (data.role === "teacher") {
      setPendingTeacherData(data);
      setShowTeacherPopup(true);
      return;
    }
    
    setIsLoading(true);
    try {
      await register(data.email, data.password, data.displayName, data.role);
      toast({
        title: "Account created!",
        description: "Welcome to 12Digits. Start your trading journey!",
      });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Could not create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherContinue = async () => {
    if (!pendingTeacherData) return;
    
    setIsLoading(true);
    try {
      await register(
        pendingTeacherData.email, 
        pendingTeacherData.password, 
        pendingTeacherData.displayName, 
        pendingTeacherData.role
      );
      toast({
        title: "Account created!",
        description: "Now let's set up your School subscription.",
      });
      setShowTeacherPopup(false);
      setLocation("/pricing");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Could not create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-muted/50 to-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">12Digits</span>
          </Link>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Join thousands learning to trade with 12Digits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your name"
                        data-testid="input-displayname"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        data-testid="input-email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          data-testid="input-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a...</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-submit-register"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showTeacherPopup} onOpenChange={setShowTeacherPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">Welcome, Teacher!</DialogTitle>
            <DialogDescription className="text-center">
              To access the Teacher Dashboard and manage your students, you'll need to subscribe to our School Plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                School Plan - $8.49/student/month
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Create unlimited classes</li>
                <li>Add and manage student accounts</li>
                <li>Track student progress and performance</li>
                <li>Class leaderboards and analytics</li>
                <li>Full access to all lessons and simulator</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button 
              onClick={handleTeacherContinue} 
              className="w-full"
              disabled={isLoading}
              data-testid="button-teacher-continue"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue to Plans
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowTeacherPopup(false)}
              className="w-full"
              data-testid="button-teacher-cancel"
            >
              Go Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
