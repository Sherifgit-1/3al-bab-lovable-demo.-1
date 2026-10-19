import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, numeric, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('CUSTOMER').notNull(),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const smartBoxes = pgTable('smart_boxes', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  address: text('address').notNull(),
  totalCompartments: integer('total_compartments').default(4).notNull(),
  isOnline: boolean('is_online').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  merchantId: text('merchant_id').notNull(),
  merchantName: text('merchant_name').notNull(),
  driverId: text('driver_id'),
  driverName: text('driver_name'),
  smartBoxId: text('smart_box_id').references(() => smartBoxes.id),
  compartmentId: text('compartment_id').default('01'),
  status: text('status').default('NEW').notNull(),
  totalAmount: numeric('total_amount').notNull(),
  itemsCount: integer('items_count').default(1).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const accessAuthorizations = pgTable('access_authorizations', {
  id: serial('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id).notNull(),
  driverId: text('driver_id').notNull(),
  driverName: text('driver_name').notNull(),
  smartBoxId: text('smart_box_id').references(() => smartBoxes.id).notNull(),
  compartmentId: text('compartment_id').notNull(),
  otpCode: text('otp_code').notNull(),
  status: text('status').default('PENDING').notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  smartBox: one(smartBoxes, {
    fields: [orders.smartBoxId],
    references: [smartBoxes.id],
  }),
  authorizations: many(accessAuthorizations),
}));

export const accessAuthorizationsRelations = relations(accessAuthorizations, ({ one }) => ({
  order: one(orders, {
    fields: [accessAuthorizations.orderId],
    references: [orders.id],
  }),
  smartBox: one(smartBoxes, {
    fields: [accessAuthorizations.smartBoxId],
    references: [smartBoxes.id],
  }),
}));
