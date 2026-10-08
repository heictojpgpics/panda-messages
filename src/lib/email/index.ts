/**
 * Everything the app needs to send mail, in one import. The provider moves
 * bytes, the palette and copy give every theme and occasion its own voice,
 * the shell paints the mail piece, and the templates write the letters.
 */
export { emailMode, sendEmail, listOutboxForUser } from "./provider";
export type { OutgoingEmail, SendResult } from "./provider";
export {
  cardDeliveryEmail,
  receiptEmail,
  claimEmail,
  ownerNotificationEmail,
} from "./templates";
export { renderPandaEmail, escapeHtml } from "./shell";
export { emailPalette } from "./palette";
