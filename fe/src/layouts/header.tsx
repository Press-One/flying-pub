import React from 'react';
import { Link } from 'react-router-dom';
import MenuIcon from '@material-ui/icons/Menu';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import AccountBalanceWallet from '@material-ui/icons/AccountBalanceWallet';
import LoginModal from 'components/LoginModal';

export default () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [openLoginModal, setOpenLoginModal] = React.useState(false);
  const handleClose = () => setAnchorEl(null);

  return (
    <div>
      <div className="absolute top-0 right-0 mt-10 mr-10 text-xl">
        <IconButton onClick={(event: any) => setAnchorEl(event.currentTarget)}>
          <MenuIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          getContentAnchorEl={null}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Link to={`/wallet`} onClick={handleClose}>
            <MenuItem className="text-gray-700 flex">
              <span className="flex items-center text-xl mr-2">
                <AccountBalanceWallet />
              </span>{' '}
              我的钱包
            </MenuItem>
          </Link>
        </Menu>
        <span className="text-blue-400 cursor-pointer" onClick={() => setOpenLoginModal(true)}>
          登陆
        </span>
        <LoginModal open={openLoginModal} onClose={() => setOpenLoginModal(false)} />
      </div>
    </div>
  );
};
