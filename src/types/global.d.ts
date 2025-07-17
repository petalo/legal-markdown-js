/// <reference types="node" />

declare global {
  namespace NodeJS {
    interface ErrnoException extends Error {
      errno?: number;
      code?: string;
      path?: string;
      syscall?: string;
      stack?: string;
    }
  }
}

export {};
