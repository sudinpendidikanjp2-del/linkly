import { auth, db, signInWithPopup, googleProvider, signOut, doc, getDoc, setDoc } from "../api";
import { User } from "../api";

export class AuthService {
  static async login(): Promise<void> {
    await signInWithPopup(auth, googleProvider);
  }

  static async logout(): Promise<void> {
    await signOut(auth);
  }

  static onAuthStateChanged(callback: (user: User | null) => void) {
    return auth.onAuthStateChanged(callback);
  }

  static async syncUserProfileAndTree(currentUser: User): Promise<void> {
    // Sync user profile
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        createdAt: new Date().toISOString(),
        role: "user"
      });
    }

    // Auto-provision default Link Tree configurations using logged-in Gmail details
    const treeRef = doc(db, "link_trees", currentUser.uid);
    const treeSnap = await getDoc(treeRef);
    if (!treeSnap.exists()) {
      await setDoc(treeRef, {
        treeTitle: currentUser.displayName || "Tautan Saya",
        treeBio: "Selamat datang di Link Tree kustom saya!",
        treeAvatar: currentUser.photoURL || "",
        treeTheme: "slate",
        treeLinks: [],
        updatedAt: new Date().toISOString()
      });
    }
  }
}
