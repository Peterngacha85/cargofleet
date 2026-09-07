import { create } from 'zustand';

type DialogRequest =
  | {
      kind: 'confirm';
      title: string;
      message: string;
      confirmLabel?: string;
      danger?: boolean;
      resolve: (confirmed: boolean) => void;
    }
  | {
      kind: 'prompt';
      title: string;
      message?: string;
      placeholder?: string;
      confirmLabel?: string;
      resolve: (value: string | null) => void;
    };

interface DialogState {
  request: DialogRequest | null;
  open: (request: DialogRequest) => void;
  close: () => void;
}

// Single global dialog, mirroring how useNotificationStore + <NotificationCenter/> work - one
// store, one host component mounted once in App.tsx, called imperatively from anywhere instead
// of every page building its own confirm/prompt modal.
export const useDialogStore = create<DialogState>((set) => ({
  request: null,
  open: (request) => set({ request }),
  close: () => set({ request: null }),
}));

export function confirmDialog(options: {
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}): Promise<boolean> {
  return new Promise((resolve) => {
    useDialogStore.getState().open({
      kind: 'confirm',
      title: options.title ?? 'Please confirm',
      message: options.message,
      confirmLabel: options.confirmLabel,
      danger: options.danger,
      resolve,
    });
  });
}

export function promptDialog(options: {
  title?: string;
  message?: string;
  placeholder?: string;
  confirmLabel?: string;
}): Promise<string | null> {
  return new Promise((resolve) => {
    useDialogStore.getState().open({
      kind: 'prompt',
      title: options.title ?? 'Enter a reason',
      message: options.message,
      placeholder: options.placeholder,
      confirmLabel: options.confirmLabel,
      resolve,
    });
  });
}
