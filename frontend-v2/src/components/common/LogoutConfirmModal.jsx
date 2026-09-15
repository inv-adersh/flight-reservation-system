import ConfirmModal from "@/components/common/ConfirmModal";
import { useTranslation } from "react-i18next";

export default function LogoutConfirmModal({ isAdmin, onConfirm, onCancel }) {
  const { t } = useTranslation();
  return (
    <ConfirmModal
      isOpen={true}
      variant="danger"
      icon="logout"
      title={t('auth.signOutPrompt')}
      description={t('auth.signOutDesc')}
      confirmText={t('auth.yesSignOut')}
      cancelText={t('auth.cancel')}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
