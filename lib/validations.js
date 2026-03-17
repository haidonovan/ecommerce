import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export const productSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().min(10),
  price: z.coerce.number().min(0),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  stock: z.coerce.number().int().min(0),
  imageUrl: z.string().url(),
});
