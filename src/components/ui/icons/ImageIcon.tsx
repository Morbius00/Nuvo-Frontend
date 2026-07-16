import { ComponentType } from 'react';
import { Image } from 'react-native';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Anything renderable with the same (size, color, strokeWidth) calling convention as a lucide icon. */
export type IconComponent = ComponentType<IconProps>;

/** Wraps a static image asset so it can drop into any spot that expects a lucide-style icon component. */
function createImageIcon(source: number): IconComponent {
  return function ImageIcon({ size = 24 }: IconProps) {
    return <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />;
  };
}

export const AnalyticsIcon = createImageIcon(require('../../../../assets/Icons/Analytics.png'));
export const BankingIcon = createImageIcon(require('../../../../assets/Icons/Banking.png'));
export const BillsIcon = createImageIcon(require('../../../../assets/Icons/Bills.png'));
export const CalendarIcon = createImageIcon(require('../../../../assets/Icons/Calender.png'));
export const CashIcon = createImageIcon(require('../../../../assets/Icons/Cash.png'));
export const EntertainmentIcon = createImageIcon(require('../../../../assets/Icons/Entertainment.webp'));
export const FoodIcon = createImageIcon(require('../../../../assets/Icons/Food.png'));
export const GiftIcon = createImageIcon(require('../../../../assets/Icons/Gift.png'));
export const HealthIcon = createImageIcon(require('../../../../assets/Icons/Health.png'));
export const NotificationIcon = createImageIcon(require('../../../../assets/Icons/Notification.png'));
export const ParcelIcon = createImageIcon(require('../../../../assets/Icons/Parcel.png'));
export const ShoppingIcon = createImageIcon(require('../../../../assets/Icons/Shopping.png'));
export const TransferIcon = createImageIcon(require('../../../../assets/Icons/Transfer.png'));
export const TransportIcon = createImageIcon(require('../../../../assets/Icons/Transport.png'));
export const TrophyIcon = createImageIcon(require('../../../../assets/Icons/Trophy.png'));
export const WalletIcon = createImageIcon(require('../../../../assets/Icons/Wallet.png'));
