import { useTranslation } from "react-i18next";
import ConfirmModal from "@/components/common/ConfirmModal";

export default function DuplicatePassengerModal({ isOpen, onConfirm, onCancel }) {
  const { t } = useTranslation();
  return (
    <ConfirmModal
      isOpen={isOpen}
      variant="warning"
      icon="warning"
      title={t('passenger.duplicateTitle')}
      description={t('passenger.duplicateDesc')}
      confirmText={t('passenger.confirm')}
      cancelText={t('passenger.goBack')}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
