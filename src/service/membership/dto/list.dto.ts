import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const listMembershipSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  sort_by: z
    .enum(['created_at', 'points', 'lifetime_points', 'first_name', 'email'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  search_by: z.enum(['name', 'email', 'phone']).optional(),
  search: z.string().optional(),
  tier_id: z.coerce.number().int().optional(),
});

export class ListMembershipDto extends createZodDto(listMembershipSchema) {}

interface MembershipUser {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface MembershipTier {
  id: string;
  name: string;
  required_points: number;
}

interface MembershipItem {
  id: string;
  points: number;
  lifetime_points: number;
  created_at: Date;
  updated_at: Date;
  userId: string;
  tierId: string | null;
  users: MembershipUser;
  tiers: MembershipTier | null;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ListMembershipResponse {
  data: MembershipItem[];
  meta: PaginationMeta;
}