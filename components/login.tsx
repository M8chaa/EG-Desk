import { useState } from "react";
import { auth, provider } from "@/lib/firebaseConfig"; // Import Firebase auth and provider
import { signInWithPopup } from "firebase/auth";
import { Button } from "@/components/ui/button";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user; // Get the signed-in user
      console.log("User signed in:", user);
      // You can handle additional logic here, like redirecting or storing user info
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleLogin} disabled={isLoading}>
      {isLoading ? "Loading..." : "Login with Google"}
    </Button>
  );
};

export default Login;