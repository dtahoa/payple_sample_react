const express = require("express");
const axios = require("axios");
const router = express.Router();

/* POST /api
  * In IOS, AOS apps, and in-app browsers, the payment window call method must be connected directly.
  * Direct call method moves to the payment page and sends payment result parameters through POST when payment is completed.
  * ref: https://developer.payple.kr/service/faq
  */
router.post('/', (req, res) => {
    console.log("########### 1: PAYMENT COMPLETED STATUS: ", req.body.PCD_PAY_RST)
    const data = {
        PCD_PAY_RST: req.body.PCD_PAY_RST, // Payment request result (success|error)
        PCD_PAY_MSG: req.body.PCD_PAY_MSG, // Payment request result message
        PCD_PAY_OID: req.body.PCD_PAY_OID, // Order number
        PCD_PAY_TYPE: req.body.PCD_PAY_TYPE, // Payment method (transfer | card)
        PCD_PAY_WORK: req.body.PCD_PAY_WORK, // Payment request task classification (AUTH: identity verification + account registration, CERT: identity verification + account registration + payment request registration (final payment approval request required), PAY: identity verification + account registration + Complete payment)
        PCD_PAYER_ID: req.body.PCD_PAYER_ID, // Billing key returned after card registration
        PCD_PAYER_NO: req.body.PCD_PAYER_NO, // Merchant member unique number
        PCD_PAYER_NAME: req.body.PCD_PAYER_NAME, // Payer name
        PCD_PAYER_EMAIL: req.body.PCD_PAYER_EMAIL, // Payer Email
        PCD_REGULER_FLAG: req.body.PCD_REGULER_FLAG, // Regular payment status (Y | N)
        PCD_PAY_YEAR: req.body.PCD_PAY_YEAR, // Payment type year (response when using PCD_REGULER_FLAG)
        PCD_PAY_MONTH: req.body.PCD_PAY_MONTH, // Payment classification month (response when using PCD_REGULER_FLAG)
        PCD_PAY_GOODS: req.body.PCD_PAY_GOODS, // Payment product
        PCD_PAY_TOTAL: req.body.PCD_PAY_TOTAL, // Payment amount
        PCD_PAY_TAXTOTAL: req.body.PCD_PAY_TAXTOTAL, // This is the amount required for complex taxation (taxation + tax exemption) orders, and sets the value sent from the affiliated store as value-added tax. It is not used in case of taxation or non-taxation.
        PCD_PAY_ISTAX: req.body.PCD_PAY_ISTAX, // Taxation settings (Default: Y, Taxation: Y, Complex taxation: Y, Non-taxation: N)
        PCD_PAY_CARDNAME: req.body.PCD_PAY_CARDNAME, // [Card payment] Card company name
        PCD_PAY_CARDNUM: req.body.PCD_PAY_CARDNUM, // [Card payment] Card number (ex: 1234-****-****-5678)
        PCD_PAY_CARDTRADENUM: req.body.PCD_PAY_CARDTRADENUM, // [Card payment] Card payment transaction number
        PCD_PAY_CARDAUTHNO: req.body.PCD_PAY_CARDAUTHNO, // [Card payment] Card payment authorization number
        PCD_PAY_CARDRECEIPT: req.body.PCD_PAY_CARDRECEIPT, // [Card payment] Card slip URL
        PCD_PAY_TIME: req.body.PCD_PAY_TIME, // Payment time (format: yyyyMMddHHmmss, ex: 20210610142219)
        PCD_TAXSAVE_RST: req.body.PCD_TAXSAVE_RST, // Cash receipt issuance result (Y | N)
        PCD_AUTH_KEY: req.body.PCD_AUTH_KEY, // Authentication key for payment
        PCD_PAY_REQKEY: req.body.PCD_PAY_REQKEY, // Payment request unique KEY
        PCD_PAY_COFURL: req.body.PCD_PAY_COFURL // Payment approval request URL
    };
    console.log("########### 2: PAYMENT REDIRECT TO ORDER RESULT PAGE")
    // React로 값 전송 (url parameters)
    res.redirect(process.env.REACT_APP_HOSTNAME + '/react/order_result?' + encodeURIComponent(JSON.stringify(data)));
});

/* POST /api/auth
    Partner Certification
  */
router.post('/auth', async (req, res, next) => {
    console.log("########### 3: POST /AUTH API")
    try {
        const caseParams = req.body; // Partner authentication parameters for each situation
         const params = {
             cst_id: process.env.REACT_APP_CST_ID, // Partner ID (Please enter the operational ID issued at the time of actual payment.)
             custKey: process.env.REACT_APP_CUST_KEY, // Partner authentication key (Please enter the operation key issued when making the actual payment.)
             ...caseParams
         };

         /* ※ Referer setting method
             TEST: In referer, you must enter the domain that displays the test payment window. If the domain where the payment window will be displayed and the referer value are different, a [AUTH0007] response will occur.
             REAL: You must enter the domain registered as the affiliated store domain in referer.
             If you enter a different domain, a [AUTH0004] response will occur.
             Also, as in TEST, it must be the same domain that displays the payment window.
         */
        const {data} = await axios.post(process.env.REACT_APP_AUTH_URL, params, {
            headers: {
                'content-type': 'application/json',
                'referer': process.env.REACT_APP_HOSTNAME
            }
        });

        res.status(200).json(data);
    } catch (e) {
        console.log("########### 3.1: POST /AUTH ERROR", e.message())
        console.error(e);
        res.status(500).send(e.message);
    }
});


module.exports = router;