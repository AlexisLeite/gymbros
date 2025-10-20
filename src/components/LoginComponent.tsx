import { signInWithPopup } from "../firebase/firebase";
import { SessionManager } from "../firebase/SessionManager";

function LoginComponent() {
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup();
      const user = result.user;
      SessionManager.instance.user = user
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', (error as any).message);
    }
  };

  return (
    <div>
      <h2>Iniciar Sesión</h2>
      <button onClick={handleGoogleSignIn}>
        Iniciar Sesión con Google
      </button>
    </div>
  );
}

export default LoginComponent;
