import { toast, type ToastOptions } from "react-hot-toast";

const defaultToastOptions: ToastOptions = {
    position: "top-center",
    duration: 4000
};

export const notifySuccess = (message: string, options: ToastOptions = {}) => {
    return toast.success(message, { ...defaultToastOptions, ...options });
};

export const notifyError = (message: string, options: ToastOptions = {}) => {
    return toast.error(message, { ...defaultToastOptions, ...options });
};

export const notifyLoading = (message: string, options: ToastOptions = {}) => {
    return toast.loading(message, { ...defaultToastOptions, ...options });
};

export const notifyDefault = (message: string, options: ToastOptions = {}) => {
    return toast(message, { ...defaultToastOptions, ...options });
};

export const notifyDismiss = (id: string) => {
    return toast.dismiss(id);
}

