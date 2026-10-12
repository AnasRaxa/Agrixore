import mongoose, { Schema } from 'mongoose';
import type { AdminRole } from '@agrixore/shared';
import type { AdminUser, AdminUserRepo } from './userRepo';

interface AdminDoc { email: string; passwordHash: string; role: AdminRole; lastLoginAt?: Date }
type LeanAdmin = AdminDoc & { _id: { toString(): string } };

const adminSchema = new Schema<AdminDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, default: 'admin' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true, collection: 'adminUsers', versionKey: false },
);

export const AdminModel = mongoose.models.AdminUser ?? mongoose.model<AdminDoc>('AdminUser', adminSchema);

const toUser = (d: LeanAdmin): AdminUser => ({ id: d._id.toString(), email: d.email, passwordHash: d.passwordHash, role: d.role });
const isObjectId = (id: string) => /^[a-f0-9]{24}$/i.test(id);

export class MongoAdminUserRepo implements AdminUserRepo {
  async findByEmail(email: string) {
    const d = await AdminModel.findOne({ email }).lean<LeanAdmin | null>();
    return d ? toUser(d) : null;
  }

  async findById(id: string) {
    if (!isObjectId(id)) return null;
    const d = await AdminModel.findById(id).lean<LeanAdmin | null>();
    return d ? toUser(d) : null;
  }

  async create({ email, passwordHash }: { email: string; passwordHash: string }) {
    const d = await AdminModel.create({ email, passwordHash, role: 'admin' });
    return toUser(d.toObject() as LeanAdmin);
  }

  async setPassword(email: string, passwordHash: string) {
    const res = await AdminModel.updateOne({ email }, { $set: { passwordHash } });
    return res.matchedCount === 1;
  }

  async touchLogin(id: string) {
    if (isObjectId(id)) await AdminModel.updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } });
  }
}
