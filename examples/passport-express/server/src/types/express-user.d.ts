// Tell Passport's types what shape `req.user` has in this app.
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      image: string | null;
    }
  }
}

export {};
