export type JwtPayload = {
  id: string;
  email: string;
  role: "client" | "freelancer" | "admin";
};

export type RefreshTokenPayload = {
  id: string;
};

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AppRole = JwtPayload["role"];
