/**
 * Validation schemas and utilities for file attachments
 */

// ============ CONSTANTS ============

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_ATTACHMENTS_PER_ARRANGEMENT = 10;

// MIME types allowed for attachments
export const ALLOWED_ATTACHMENT_TYPES = [
  // PDFs
  "application/pdf",
  // Music notation formats
  "application/x-dorico", // .dorico
  "application/x-finale", // .musx, .mus
  "application/x-sibelius", // .sib
  "application/vnd.recordare.musicxml", // .musicxml
  "application/vnd.recordare.musicxml+xml",
  "text/xml", // .xml (MusicXML)
  "application/xml",
  "audio/midi", // .mid, .midi
  "audio/x-midi",
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Documents
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "text/plain", // .txt
  // Allow octet-stream for music files that browsers don't recognize
  "application/octet-stream",
];

// File extensions allowed (for validation when MIME type is octet-stream)
export const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".dorico",
  ".musx",
  ".mus",
  ".sib",
  ".musicxml",
  ".xml",
  ".mid",
  ".midi",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".doc",
  ".docx",
  ".txt",
];

// For file input accept attribute
export const ATTACHMENT_ACCEPT_STRING = ALLOWED_EXTENSIONS.join(",");

// ============ FILE CATEGORIES ============

export type FileCategory = "pdf" | "notation" | "image" | "document" | "unknown";

export const FILE_CATEGORIES: Record<
  Exclude<FileCategory, "unknown">,
  {
    extensions: string[];
    mimeTypes: string[];
    label: string;
  }
> = {
  pdf: {
    extensions: [".pdf"],
    mimeTypes: ["application/pdf"],
    label: "PDF",
  },
  notation: {
    extensions: [
      ".dorico",
      ".musx",
      ".mus",
      ".sib",
      ".musicxml",
      ".xml",
      ".mid",
      ".midi",
    ],
    mimeTypes: [
      "application/x-dorico",
      "application/x-finale",
      "application/x-sibelius",
      "application/vnd.recordare.musicxml",
      "application/vnd.recordare.musicxml+xml",
      "text/xml",
      "application/xml",
      "audio/midi",
      "audio/x-midi",
    ],
    label: "Music Notation",
  },
  image: {
    extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
    label: "Image",
  },
  document: {
    extensions: [".doc", ".docx", ".txt"],
    mimeTypes: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
    label: "Document",
  },
};

// ============ VALIDATION ============

/**
 * Validate a file before upload
 */
export function validateAttachmentFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file size
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum of ${formatFileSize(MAX_ATTACHMENT_SIZE)}`,
    };
  }

  // Check MIME type or extension
  const extension = getFileExtension(file.name).toLowerCase();
  const mimeType = file.type.toLowerCase();

  // If MIME type is recognized, check it
  if (mimeType && mimeType !== "application/octet-stream") {
    if (!ALLOWED_ATTACHMENT_TYPES.includes(mimeType)) {
      return {
        valid: false,
        error: `File type "${mimeType}" is not supported`,
      };
    }
  } else {
    // For octet-stream or empty MIME type, check extension
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `File extension "${extension}" is not supported`,
      };
    }
  }

  return { valid: true };
}

// ============ UTILITIES ============

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}

/**
 * Determine file category from MIME type or extension
 */
export function getFileCategory(mimeType: string, fileName: string): FileCategory {
  const extension = getFileExtension(fileName).toLowerCase();
  const mime = mimeType.toLowerCase();

  // Check each category
  for (const [category, config] of Object.entries(FILE_CATEGORIES)) {
    // Check by MIME type first
    if (mime && mime !== "application/octet-stream") {
      if (config.mimeTypes.includes(mime)) {
        return category as FileCategory;
      }
    }
    // Fall back to extension
    if (config.extensions.includes(extension)) {
      return category as FileCategory;
    }
  }

  return "unknown";
}

/**
 * Get human-readable file category label
 */
export function getFileCategoryLabel(category: FileCategory): string {
  if (category === "unknown") return "File";
  return FILE_CATEGORIES[category].label;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  // Show decimals only for MB and above
  if (i >= 2) {
    return `${size.toFixed(1)} ${units[i]}`;
  }
  return `${Math.round(size)} ${units[i]}`;
}

/**
 * Generate a display name from original filename
 * Removes extension and cleans up common patterns
 */
export function generateDisplayName(originalName: string): string {
  // Remove extension
  const lastDot = originalName.lastIndexOf(".");
  const nameWithoutExt = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;

  // Clean up underscores and dashes
  return nameWithoutExt
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
