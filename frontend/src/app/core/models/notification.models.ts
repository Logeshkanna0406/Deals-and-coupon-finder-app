export type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP';

export interface NotificationResponse {
  id: number;
  recipient: string;
  recipientType: string;
  subject: string;
  message: string;
  channel: NotificationChannel;
  sentAt: string;
}
