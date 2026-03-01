import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getTelegramUserByTelegramId,
  createOrUpdateTelegramUser,
  getSubscribedTelegramUsers,
} from "../db";

export const telegramRouter = router({
  // Register or update Telegram user
  registerUser: publicProcedure
    .input(
      z.object({
        telegramId: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        username: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createOrUpdateTelegramUser({
        telegramId: input.telegramId,
        firstName: input.firstName,
        lastName: input.lastName,
        username: input.username,
        isSubscribed: true,
      });
    }),

  // Get user preferences
  getUser: publicProcedure
    .input(z.object({ telegramId: z.string() }))
    .query(async ({ input }) => {
      return await getTelegramUserByTelegramId(input.telegramId);
    }),

  // Get all subscribed users
  getSubscribedUsers: publicProcedure.query(async () => {
    return await getSubscribedTelegramUsers();
  }),

  // Subscribe user to notifications
  subscribe: publicProcedure
    .input(z.object({ telegramId: z.string() }))
    .mutation(async ({ input }) => {
      const user = await getTelegramUserByTelegramId(input.telegramId);
      if (user) {
        return await createOrUpdateTelegramUser({
          ...user,
          isSubscribed: true,
        });
      }
      return null;
    }),

  // Unsubscribe user from notifications
  unsubscribe: publicProcedure
    .input(z.object({ telegramId: z.string() }))
    .mutation(async ({ input }) => {
      const user = await getTelegramUserByTelegramId(input.telegramId);
      if (user) {
        return await createOrUpdateTelegramUser({
          ...user,
          isSubscribed: false,
        });
      }
      return null;
    }),
});
