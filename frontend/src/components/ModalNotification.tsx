import { useEffect } from "react";
import type { ReactNode } from "react";
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoWarningOutline,
  IoInformationCircleOutline,
} from "react-icons/io5";
import { HiMiniQueueList } from "react-icons/hi2";

interface ModalNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  children?: ReactNode;
}
export default function ModalNotification(props: ModalNotificationProps) {
  const { isOpen, onClose, title, message, type = "info", children } = props;
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeConfig = {
    success: {
      icon: <IoCheckmarkCircleOutline className="w-12 h-12" />,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    error: {
      icon: <IoCloseCircleOutline className="w-12 h-12" />,
      iconBg: "bg-red-100 dark:bg-red-900/40",
      iconColor: "text-red-600 dark:text-red-400",
      buttonBg: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      icon: <IoWarningOutline className="w-12 h-12" />,
      iconBg: "bg-amber-100 dark:bg-amber-900/40",
      iconColor: "text-amber-600 dark:text-amber-400",
      buttonBg: "bg-amber-600 hover:bg-amber-700",
    },
    info: {
      icon: <IoInformationCircleOutline className="w-12 h-12" />,
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      buttonBg: "bg-blue-600 hover:bg-blue-700",
    },
    download: {
      icon: (
        <div>
          <span></span>
          <HiMiniQueueList className="w-8 h-8" />
        </div>
      ),
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      buttonBg: "bg-blue-600 hover:bg-blue-700",
    },
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-white/40 dark:bg-gray-900/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full mx-auto border border-gray-200 dark:border-gray-700 animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Fechar"
        >
          <IoCloseCircleOutline className="cursor-pointer w-6 h-6 transition-colors" />
        </button>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4 pr-6">
            <div
              className={`w-12 h-12 rounded-full ${config.iconBg} ${config.iconColor} flex items-center justify-center flex-shrink-0`}
            >
              {config.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {message}
              </p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
