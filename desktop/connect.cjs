const address = document.querySelector('#address');
const status = document.querySelector('#status');
const submit = document.querySelector('button');

window.diceManiac.savedServer().then(server => {
  if (!address.value) address.value = server;
});

window.diceManiac.onUnavailable(() => {
  status.textContent = 'Không kết nối được. Kiểm tra địa chỉ và máy chủ rồi thử lại.';
});

document.querySelector('form').addEventListener('submit', async event => {
  event.preventDefault();
  submit.disabled = true;
  status.textContent = 'Đang kết nối…';
  try {
    const error = await window.diceManiac.connect(address.value.trim());
    if (error) status.textContent = error;
  } catch {
    status.textContent = 'Không lưu được địa chỉ máy chủ.';
  } finally {
    submit.disabled = false;
  }
});
