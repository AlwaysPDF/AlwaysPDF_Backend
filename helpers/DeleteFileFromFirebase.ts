// deleteFromFirebase.ts
import bucket from "../utils/firebase.js";

const DeleteFileFromFirebase = async (imageUrl: string) => {
  try {
    const url = new URL(imageUrl);
    const pathname = decodeURIComponent(url.pathname);
    const key = pathname?.split("/o/")[1]?.split("?")[0]; // key is the file path in the bucket

    if (!key) {
      throw new Error("Invalid Firebase storage URL: " + imageUrl);
    }

    await bucket.file(key).delete();
  } catch (error: any) {
    if (error?.code === 404) {
      console.warn("File not found in bucket, skipping:", imageUrl);
      return;
    }
    console.error("Delete error:", error?.message);
    // optionally rethrow to let parent function handle if needed
    throw error;
  }
};

export default DeleteFileFromFirebase;
