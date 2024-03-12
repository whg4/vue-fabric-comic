import { v4 as uuid } from 'uuid';

export const downFile = (fileStr: string, fileType: string) => {
  const anchorEl = document.createElement('a');
  anchorEl.href = fileStr;
  anchorEl.download = `${uuid()}.${fileType}`;
  document.body.appendChild(anchorEl); // required for firefox
  anchorEl.click();
  anchorEl.remove();
};
