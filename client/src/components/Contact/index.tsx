import React from 'react';
import Modal from '@material-ui/core/Modal';
import Help from '@material-ui/icons/Help';
import Fade from '@material-ui/core/Fade';

export default () => {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 5000);
  }, []);

  const Entry = () => (
    <div
      className="fixed bottom-0 right-0 m-1 flex items-center justify-center text-5xl cursor-pointer text-blue-400 transform scale-90"
      onClick={() => setOpen(true)}
    >
      <Help />
    </div>
  );

  const ContactModal = () => (
    <Modal open={open} onClose={() => setOpen(false)} className="flex justify-center items-center">
      <div className="modal-content bg-white rounded-12 text-center p-8">
        <div className="text-lg font-bold text-gray-700">扫码加微信，联系我们</div>
        <div className="mt-5 flex items-center gray-color text-center text-sm px-10">
          <div className="flex flex-col items-center mr-10">
            <img
              src="https://img-cdn.xue.cn/714-contact-1.jpg"
              width="180"
              height="180"
              alt="cgq144"
            />
            <div className="mt-1">cgq144</div>
          </div>
          <div className="flex flex-col items-center">
            <img
              src="https://img-cdn.xue.cn/714-contact-2.jpg"
              width="180"
              height="180"
              alt="qiaoanlu"
            />
            <div className="mt-1">qiaoanlu</div>
          </div>
        </div>
      </div>
    </Modal>
  );

  if (loading) {
    return null;
  }

  return (
    <Fade in={true} timeout={500}>
      <div>
        <Entry />
        <ContactModal />
      </div>
    </Fade>
  );
};
