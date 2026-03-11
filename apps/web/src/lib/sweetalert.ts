import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Create a mixin with our POS Pizza premium styling
// Aligned with the /admin design DNA: glassmorphism, gradients, premium feel
export const posAlert = MySwal.mixin({
  customClass: {
    container: 'pos-swal-backdrop',
    popup: 'pos-swal-popup',
    title: 'pos-swal-title',
    htmlContainer: 'pos-swal-text',
    confirmButton: 'pos-swal-confirm',
    cancelButton: 'pos-swal-cancel',
    actions: 'pos-swal-actions',
    icon: 'pos-swal-icon',
  },
  buttonsStyling: false,
  showClass: {
    popup: 'animate-in zoom-in-95 fade-in duration-300 ease-out fill-mode-both',
    backdrop: 'animate-in fade-in duration-300 ease-out fill-mode-both',
  },
  hideClass: {
    popup: 'animate-out zoom-out-95 fade-out duration-200 ease-in fill-mode-both',
    backdrop: 'animate-out fade-out duration-200 ease-in fill-mode-both',
  },
});
