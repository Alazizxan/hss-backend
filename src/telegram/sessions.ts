export interface UserSession {
    step?: string;

    emailOrUsername?: string;

    selectedMonths?: number;

    selectedUserId?: string;

    supportMode?: boolean;

    waitingReceipt?: boolean;

    activeSupport?: boolean;
}

export const sessions = new Map<number, UserSession>();