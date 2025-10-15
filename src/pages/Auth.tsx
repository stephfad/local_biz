import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, User, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { TermsDialog } from '@/components/TermsDialog';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Form states
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  
  const [signUpForm, setSignUpForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'user' as 'user' | 'business',
    // User fields
    username: '',
    displayName: '',
    // Business fields
    businessName: '',
    businessDescription: '',
    businessCategory: '',
    // Terms acceptance
    acceptTerms: false,
  });

  // Redirect authenticated users
  useEffect(() => {
    if (user && !authLoading) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location.state]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!loginForm.email || !loginForm.password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(loginForm.email, loginForm.password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please check your email and click the confirmation link');
      } else {
        setError(error.message || 'An error occurred during login');
      }
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!signUpForm.email || !signUpForm.password || !signUpForm.confirmPassword) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    if (signUpForm.accountType === 'business' && !signUpForm.businessName) {
      setError('Business name is required for business accounts');
      setIsLoading(false);
      return;
    }

    if (signUpForm.password !== signUpForm.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (signUpForm.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (!signUpForm.acceptTerms) {
      setError('You must accept the Terms and Conditions to create an account');
      setIsLoading(false);
      return;
    }

    const userData = signUpForm.accountType === 'user' 
      ? {
          username: signUpForm.username,
          displayName: signUpForm.displayName,
        }
      : {
          businessName: signUpForm.businessName,
          businessDescription: signUpForm.businessDescription,
          businessCategory: signUpForm.businessCategory,
        };

    const { error } = await signUp(
      signUpForm.email,
      signUpForm.password,
      signUpForm.accountType,
      userData
    );
    
    if (error) {
      if (error.message.includes('User already registered')) {
        setError('An account with this email already exists');
      } else if (error.message.includes('Password should be at least')) {
        setError('Password must be at least 6 characters long');
      } else {
        setError(error.message || 'An error occurred during sign up');
      }
    } else {
      toast({
        title: "Account created!",
        description: "Please check your email for a confirmation link.",
      });
    }
    
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Account Type Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="account-type">Account Type *</Label>
                    <Select
                      value={signUpForm.accountType}
                      onValueChange={(value: 'user' | 'business') => 
                        setSignUpForm(prev => ({ ...prev, accountType: value }))
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>Personal Account - Leave reviews</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="business">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span>Business Account - Get reviewed</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* User Account Fields */}
                  {signUpForm.accountType === 'user' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-username">Username</Label>
                        <Input
                          id="signup-username"
                          type="text"
                          placeholder="Choose a username"
                          value={signUpForm.username}
                          onChange={(e) => setSignUpForm(prev => ({ ...prev, username: e.target.value }))}
                          disabled={isLoading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-display-name">Display Name</Label>
                        <Input
                          id="signup-display-name"
                          type="text"
                          placeholder="Your display name"
                          value={signUpForm.displayName}
                          onChange={(e) => setSignUpForm(prev => ({ ...prev, displayName: e.target.value }))}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}

                  {/* Business Account Fields */}
                  {signUpForm.accountType === 'business' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="business-name">Business Name *</Label>
                        <Input
                          id="business-name"
                          type="text"
                          placeholder="Your business name"
                          value={signUpForm.businessName}
                          onChange={(e) => setSignUpForm(prev => ({ ...prev, businessName: e.target.value }))}
                          disabled={isLoading}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="business-category">Business Category</Label>
                        <Select
                          value={signUpForm.businessCategory}
                          onValueChange={(value) => 
                            setSignUpForm(prev => ({ ...prev, businessCategory: value }))
                          }
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select business category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Restaurant">Restaurant</SelectItem>
                            <SelectItem value="Retail">Retail</SelectItem>
                            <SelectItem value="Healthcare">Healthcare</SelectItem>
                            <SelectItem value="Services">Services</SelectItem>
                            <SelectItem value="Automotive">Automotive</SelectItem>
                            <SelectItem value="Beauty">Beauty & Wellness</SelectItem>
                            <SelectItem value="Entertainment">Entertainment</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="business-description">Business Description</Label>
                        <Textarea
                          id="business-description"
                          placeholder="Describe your business..."
                          value={signUpForm.businessDescription}
                          onChange={(e) => setSignUpForm(prev => ({ ...prev, businessDescription: e.target.value }))}
                          disabled={isLoading}
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email *</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signUpForm.email}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, email: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password *</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password (min. 6 characters)"
                      value={signUpForm.password}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, password: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password *</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={signUpForm.confirmPassword}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                   </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="accept-terms"
                      checked={signUpForm.acceptTerms}
                      onCheckedChange={(checked) => 
                        setSignUpForm(prev => ({ ...prev, acceptTerms: checked as boolean }))
                      }
                      disabled={isLoading}
                      required
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="accept-terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the{' '}
                        <TermsDialog>
                          <Button variant="link" className="h-auto p-0 text-sm underline">
                            Terms and Conditions
                          </Button>
                        </TermsDialog>
                        {' '}*
                      </label>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;