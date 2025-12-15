export const renderSendActivationLink = (
	link: string,
	content: string
): string => {
	return `
		 <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:white; padding:30px; border-radius:8px;">
            
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <h1 style="margin:0; font-size:24px; color:#333333;">
                  Для ${content} перейдите, пожалуйста, по кнопке ниже:
                </h1>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:25px 0;">
                <a href="${link}"
                   style="
                     display:inline-block;
                     padding:14px 26px;
                     background-color:#4c73af;
                     color:white;
                     text-decoration:none;
                     font-size:16px;
                     border-radius:6px;
                     font-weight:bold;
                     text-align:center;
                   ">
                  ${content}
                </a>
              </td>
            </tr>

            <tr>
              <td align="center" style="font-size:14px; color:#777; padding-top:20px;">
                Если кнопка не работает, откройте ссылку вручную:<br />
                <span style="color:#4CAF50; word-break:break-all;">${link}</span>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
	`
}

export const renderSendActivationTwoFactoryAuth = (code: string): string => {
	return `
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0; background-color:#f5f5f5;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:white; padding:30px; border-radius:8px;">
          
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h1 style="margin:0; font-size:24px; color:#333333;">
                Для входа введите данный код:
              </h1>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:10px 0;">
              <div style="
                font-size:34px;
                font-weight:bold;
                color:#4c73af;
                background:#eef3ff;
                border-radius:8px;
                padding:16px 40px;
                letter-spacing:6px;
                display:inline-block;
              ">
                ${code}
              </div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:20px; font-size:14px; color:#777;">
              Код действует ограниченное время. Никому его не сообщайте.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
  `
}
