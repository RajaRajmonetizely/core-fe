export interface SnackbarProps {
  readonly type?: any;
  readonly display: boolean;
  readonly message?: string;
  readonly onClose?: () => void;
}
