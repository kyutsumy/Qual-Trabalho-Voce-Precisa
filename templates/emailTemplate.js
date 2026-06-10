module.exports = function emailTemplate(code) {
	return `
	<!DOCTYPE html>
	<html lang="pt-BR">
	<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
	</head>

	<body style="
	margin:0;
	padding:0;
	background:#0a0a0a;
	font-family:Arial, Helvetica, sans-serif;
	color:#ffffff;
	">

	<table width="100%" cellpadding="0" cellspacing="0" border="0">
	<tr>
	<td align="center" style="padding:40px 15px;">

	<table width="600" cellpadding="0" cellspacing="0" border="0"
	style="
	width:100%;
	max-width:600px;
	background:#111111;
	border-radius:24px;
	padding:50px 40px;
	"
	>

	<!-- TÍTULO -->
	<tr>
	<td>
	<h1 style="
	margin:0;
	font-size:42px;
	color:#ffffff;
	font-weight:700;
	">
	Olá!
	</h1>
	</td>
	</tr>

	<!-- TEXTO -->
	<tr>
	<td style="padding-top:25px;">
	<p style="
	margin:0;
	font-size:26px;
	line-height:1.6;
	color:#bdbdbd;
	">
	Seu código de verificação de e-mail é:
	</p>
	</td>
	</tr>

	<!-- CAIXA DO CÓDIGO -->
	<tr>
	<td style="padding-top:30px;">

	<div style="
	background:#241919;
	border-radius:20px;
	padding:28px;
	text-align:center;
	">

	<span style="
	font-size:58px;
	font-weight:bold;
	color:#ff6b6b;
	letter-spacing:8px;
	">
	${code}
	</span>

	</div>

	</td>
	</tr>

	<!-- INFORMAÇÃO -->
	<tr>
	<td style="padding-top:35px;">

	<p style="
	margin:0;
	font-size:21px;
	line-height:1.8;
	color:#a8a8a8;
	">
	Por favor, conclua o processo de verificação
	em até 5 minutos.
	</p>

	</td>
	</tr>

	<!-- AVISO -->
	<tr>
	<td style="padding-top:35px;">

	<p style="
	margin:0;
	font-size:20px;
	line-height:1.8;
	color:#8c8c8c;
	">
	Se você não solicitou este código,
	ignore esta mensagem.
	</p>

	</td>
	</tr>

	</table>

	</td>
	</tr>
	</table>

	</body>
	</html>`;
};
