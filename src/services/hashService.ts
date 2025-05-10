import crypto from "crypto";

/**
 * Creates a secure hash for the file ID using HMAC
 * @param fileId Google Drive file ID to hash
 * @returns URL-safe Base64 string or null if an error occurs
 */
function createHash(fileId: string): string | null {
  try {
    // Encrypt the fileId using AES for reversibility
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      crypto.scryptSync(process.env.HASH_SECRET || "", "salt", 32),
      Buffer.alloc(16, 0), // Initialization vector (IV) set to 16 bytes of zeros
    );

    let encrypted = cipher.update(fileId, "utf8", "base64");
    encrypted += cipher.final("base64");

    // Make the encrypted string URL-safe
    return encrypted.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch (error) {
    //console.error("Error al crear el hash reversible:", error);
    return null;
  }
}

/**
 * Verifies and decodes a hash to retrieve the original file ID
 * @param hash The hash to verify
 * @returns The original file ID or null if verification fails
 */
function verifyHash(hash: string): string | null {
  try {
    // Decode the URL-safe Base64 string back to the original Base64 format
    const base64Hash =
      hash.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (hash.length % 4)) % 4);

    // Decrypt the hash using AES to retrieve the original fileId
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      crypto.scryptSync(process.env.HASH_SECRET || "", "salt", 32),
      Buffer.alloc(16, 0), // Initialization vector (IV) set to 16 bytes of zeros
    );

    let decrypted = decipher.update(base64Hash, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    //console.error("Error al verificar el hash reversible:", error);
    return null;
  }
}

export { createHash, verifyHash };
