import React, {useState} from "react";
import {useLocation, useHistory} from "react-router";
import axios from "axios";

function OrderConfirm() {
    // 뒤로가기 버튼 클릭 이벤트 발생시 결제창 화면 닫음
    window.onpopstate = (e) => {
        if (e) {
            window.MainBodyAction('close');
        }
    }

    const location = useLocation();
    const history = useHistory();
    const content = location.state.content !== null || undefined ? location.state.content : null;

    let [payResult] = useState({});

    /* callback function to receive the result (PCD_RST_URL does not work when setting the callback function)
      * ref: https://developer.payple.kr/service/faq
      */
    const getResult = (res) => {
        if (res.PCD_PAY_RST === 'success') {
            payResult = res;

            // 전달받은 결제 파라미터값을 state에 저장 후  '/react/order_result'로 이동
            history.push({
                pathname: '/react/order_result',
                state: {payResult: payResult},
            });
        } else {
            // 결제 실패일 경우 알림 메시지
            window.alert(res.PCD_PAY_MSG);
        }

    }

    /*
     *  연동방식별 파라미터 세팅 ('결제하기' 버튼 클릭시 호출)
     */
    const handleClick = (e) => {
        e.preventDefault();
        const obj = {};
        /*
         *  공통 설정
         */
        obj.PCD_PAY_TYPE = content.pay_type;			                                        // (필수) 결제 방법 (transfer | card)
        obj.PCD_PAY_WORK = content.work_type;			                                        // (필수) 결제요청 업무구분 (AUTH : 본인인증+계좌등록, CERT: 본인인증+계좌등록+결제요청등록(최종 결제승인요청 필요), PAY: 본인인증+계좌등록+결제완료)
        if (content.pay_type === 'card') obj.PCD_CARD_VER = content.card_ver || '01';		    // DEFAULT: 01 (01: 정기결제 플렛폼, 02: 일반결제 플렛폼), 카드결제 시 필수
        obj.PCD_PAYER_AUTHTYPE = content.auth_type;				                                // (선택) [간편결제/정기결제] 본인인증 방식 (sms : 문자인증 | pwd : 패스워드 인증)

        // IOS, AOS앱 및 인앱브라우저에서는 결제창 호출 방식을 다이렉트로 연결해 주세요.
        // content.is_direct === 'Y' 인 경우, POST 요청을 처리할 서버 도메인을 입력해 주세요.
        // direct(절대경로): https://payple.kr/sample/pay.html | popup(상대경로) https:// 로 시작하지 않고, 중간경로( /sample/pay.html)를 표기한 URL
        // ref: https://developer.payple.kr/service/faq
        if (content.is_direct === 'Y' ? obj.PCD_RST_URL = process.env.REACT_APP_REMOTE_HOSTNAME + '/api' : obj.PCD_RST_URL = '/react/order_result') ;
        // obj.PCD_RST_URL = pcd_rst_url;							 // (필수) 결제(요청)결과 RETURN URL

        // (선택) 결과를 받고자 하는 callback 함수명 (callback함수를 설정할 경우 PCD_RST_URL 이 작동하지 않음)
        // ref: https://developer.payple.kr/service/faq
        obj.callbackFunction = getResult;

        /*
         *  빌링키 등록 (pay_work === 'AUTH')
         */
        if (content.pay_type === 'AUTH') {
            obj.PCD_PAYER_NO = content.buyer_no;					  // (선택) 가맹점 회원 고유번호 (결과전송 시 입력값 그대로 RETURN)
            obj.PCD_PAYER_NAME = content.buyer_name;				  // (선택) 결제자 이름
            obj.PCD_PAYER_HP = content.buyer_hp;					  // (선택) 결제자 휴대폰 번호
            obj.PCD_PAYER_EMAIL = content.buyer_email;				  // (선택) 결제자 Email
            obj.PCD_TAXSAVE_FLAG = content.is_taxsave;				  // (선택) 현금영수증 발행여부
            obj.PCD_REGULER_FLAG = content.is_reguler;				  // (선택) 정기결제 여부 (Y|N)
            obj.PCD_SIMPLE_FLAG = content.simple_flag;				  // (선택) 간편결제 여부 (Y|N)
        }
        /*
         *  최초결제 및 단건(일반,비회원)결제
         */
        else {
            // Whether to make simple payment ('N')
            if (content.simple_flag !== 'Y' || content.payple_payer_id === '') {
                console.log("case 1: ====================", obj);
                obj.PCD_PAYER_NO = content.buyer_no; // (Optional) Merchant member identification number (RETURN as is the entered value when sending results)
                obj.PCD_PAYER_NAME = content.buyer_name; // (Optional) Payer name
                obj.PCD_PAYER_HP = content.buyer_hp; // (Optional) Payer mobile phone number
                obj.PCD_PAYER_EMAIL = content.buyer_email; // (Optional) Payer Email
                obj.PCD_PAY_GOODS = content.buy_goods; // (Required) Payment product
                obj.PCD_PAY_TOTAL = content.buy_total; // (required) payment amount
                obj.PCD_PAY_TAXTOTAL = content.buy_taxtotal; // (Optional) VAT (required in case of complex taxation)
                obj.PCD_PAY_ISTAX = content.buy_istax; // (Optional) Taxation (Taxation: Y | Non-taxation (tax exemption): N)
                obj.PCD_PAY_OID = content.order_num; // Order number (randomly generated if not entered)
                obj.PCD_REGULER_FLAG = content.is_reguler; // (Optional) Whether to make regular payment (Y|N)
                obj.PCD_PAY_YEAR = content.pay_year; // (Required when PCD_REGULER_FLAG = Y) [Regular payment] Payment classification year (PCD_REGULER_FLAG: Required when 'Y')
                obj.PCD_PAY_MONTH = content.pay_month; // (Required when PCD_REGULER_FLAG = Y) [Regular payment] Payment type Month (PCD_REGULER_FLAG: Required when 'Y')
                obj.PCD_TAXSAVE_FLAG = content.is_taxsave; // (Optional) Whether to issue a cash receipt (Y|N)
            }
            // Whether to make a simple payment ('Y'), call the payment window of the registered billing key (PCD_PAYER_ID)
            else if (content.simple_flag === 'Y' && content.payple_payer_id !== '') {
                console.log("case 2: ====================", obj);
                obj.PCD_SIMPLE_FLAG = content.simple_flag; // Simple payment (Y|N)
                //-- Do not display PCD_PAYER_ID in the source, but be sure to load it using Server Side Script. --//
                obj.PCD_PAYER_ID = content.payple_payer_id; // Payer’s unique ID (identified payment member’s unique KEY)

                obj.PCD_PAYER_NO = content.buyer_no; // (Optional) Merchant member identification number (RETURN as is the entered value when sending results)
                obj.PCD_PAY_GOODS = content.buy_goods; // (Required) Payment product
                obj.PCD_PAY_TOTAL = content.buy_total; // (required) payment amount
                obj.PCD_PAY_TAXTOTAL = content.buy_taxtotal; // (Optional) VAT (required in case of complex taxation)
                obj.PCD_PAY_ISTAX = content.buy_istax; // (Optional) Taxation (Taxation: Y | Non-taxation (tax exemption): N)
                obj.PCD_PAY_OID = content.order_num; // Order number (randomly generated if not entered)
                obj.PCD_REGULER_FLAG = content.is_reguler; // (Optional) Whether to make regular payment (Y|N)
                obj.PCD_PAY_YEAR = content.pay_year; // (Required when PCD_REGULER_FLAG = Y) [Regular payment] Payment classification year (PCD_REGULER_FLAG: Required when 'Y')
                obj.PCD_PAY_MONTH = content.pay_month; // (Required when PCD_REGULER_FLAG = Y) [Regular payment] Payment type Month (PCD_REGULER_FLAG: Required when 'Y')
                obj.PCD_TAXSAVE_FLAG = content.is_taxsave; // (Optional) Whether to issue a cash receipt (Y|N)
            }
        }

        // 파트너 인증 - 클라이언트 키(clientKey)
        obj.clientKey = process.env.REACT_APP_CLIENT_KEY;

        window.PaypleCpayAuthCheck(obj);
    }
    return (
        <div>
            <table border="1" cellSpacing="0" cellPadding="1">
                <tr>
                    <td>구매자 이름</td>
                    <td>{content.buyer_name}</td>
                </tr>
                <tr>
                    <td>구매자 휴대폰번호</td>
                    <td>{content.buyer_hp}</td>
                </tr>
                <tr>
                    <td>구매자 Email</td>
                    <td>{content.buyer_email}</td>
                </tr>
                <tr>
                    <td>구매상품</td>
                    <td>{content.buy_goods}</td>
                </tr>
                <tr>
                    <td>결제금액</td>
                    <td>{content.buy_total}</td>
                </tr>
                <tr>
                    <td>과세여부</td>
                    <td>{content.buy_istax}</td>
                </tr>
                <tr>
                    <td>주문번호</td>
                    <td>{content.order_num}</td>
                </tr>
                <tr>
                    <td>정기결제</td>
                    <td>{content.is_reguler}</td>
                </tr>
                <tr>
                    <td>정기결제 구분년도</td>
                    <td>{content.pay_year}</td>
                </tr>
                <tr>
                    <td>정기결제 구분월</td>
                    <td>{content.pay_month}</td>
                </tr>
                <tr>
                    <td>현금영수증</td>
                    <td>{content.is_taxsave}</td>
                </tr>
                <tr>
                    <td colSpan="2" align="center">
                        <button id="payAction" onClick={handleClick}>결제하기</button>
                    </td>
                </tr>
            </table>
        </div>
    );
};

export default OrderConfirm;
