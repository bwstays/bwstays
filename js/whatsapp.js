
var url = 'https://wati-integration-prod-service.clare.ai/v2/watiWidget.js?65929';
var s = document.createElement('script');
s.type = 'text/javascript';
s.async = true;
s.src = url;
var options = {
"enabled":true,
"chatButtonSetting":{
	"backgroundColor":"#64a19d",
   // "ctaText":"Chat with us",
	"borderRadius":"3",
	"marginLeft": "0",
	"marginRight": "5",
 

	"marginBottom": "5",


 
	"ctaIconWATI":false,
	"position":"right"
},
"brandSetting":{
	"brandName":"Wati",
	"brandSubTitle":"undefined",
	"brandImg":"https://www.wati.io/wp-content/uploads/2023/04/Wati-logo.svg",
	"welcomeText":"Hi there!\nHow can I help you?",
	"messageText":"Hello, %0A I have a question about {{page_link}}",
	"backgroundColor":"#64a19d",
	"ctaText":"Chat with bw Team",
	"borderRadius":"25",
	"autoShow":false,
	"phoneNumber":"9741496273"
}
};
s.onload = function() {
	CreateWhatsappChatWidget(options);
};
var x = document.getElementsByTagName('script')[0];
x.parentNode.insertBefore(s, x);
