import React from 'react';
import Input from '@material-ui/core/Input';
import Button from '@material-ui/core/Button';
import { Link } from 'react-router-dom';

export default () => {
  const [rssUrl, setRssUrl] = React.useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRssUrl(event.target.value);
  };

  return (
    <div className="text-center po-push-page-middle po-width-50 po-center">
      <Input autoFocus fullWidth required placeholder="请输入 RSS 链接" onChange={handleChange} />
      {rssUrl && (
        <div className="push-top-lg">
          <Link to={`/${encodeURIComponent(rssUrl)}`}>
            <Button variant="contained" color="primary" className="primary">
              查看
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
