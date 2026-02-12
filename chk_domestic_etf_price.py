# [국내주식] 국내 ETF 현재가 조회 샘플코드
# -*- coding: utf-8 -*-
# 예시: TIGER KRX금현물 ETF (0072R0)

import sys
import logging

import pandas as pd

sys.path.extend(['..', '.'])
import kis_auth as ka

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

##############################################################################################
# API 상수 정의
##############################################################################################
# 국내주식 현재가 시세 (ETF 포함)
API_URL_PRICE = "/uapi/domestic-stock/v1/quotations/inquire-price"

# 컬럼 매핑 (주식현재가 시세)
PRICE_COLUMN_MAPPING = {
    'stck_prpr': '현재가',
    'prdy_vrss': '전일대비',
    'prdy_vrss_sign': '전일대비부호',
    'prdy_ctrt': '전일대비율',
    'acml_vol': '누적거래량',
    'acml_tr_pbmn': '누적거래대금',
    'stck_oprc': '시가',
    'stck_hgpr': '고가',
    'stck_lwpr': '저가',
    'stck_mxpr': '상한가',
    'stck_llam': '하한가',
    'stck_sdpr': '기준가',
    'wghn_avrg_stck_prc': '가중평균주가',
    'hts_frgn_ehrt': 'HTS외국인소진율',
    'frgn_ntby_qty': '외국인순매수수량',
    'per': 'PER',
    'pbr': 'PBR',
    'stck_dryy_hgpr': '연중최고가',
    'stck_dryy_lwpr': '연중최저가',
    'w52_hgpr': '52주최고가',
    'w52_lwpr': '52주최저가',
    'whol_loan_rmnd_rate': '전체융자잔고비율',
    'ssts_yn': '공매도가능여부',
    'stck_shrn_iscd': '주식단축종목코드',
    'bstp_kor_isnm': '업종한글종목명',
    'vi_cls_code': 'VI적용구분코드',
}

NUMERIC_COLUMNS = [
    '현재가', '전일대비', '전일대비율', '누적거래량', '누적거래대금',
    '시가', '고가', '저가', '상한가', '하한가', '기준가',
    'PER', 'PBR', '52주최고가', '52주최저가',
]


##############################################################################################
# 국내주식(ETF 포함) 현재가 조회
##############################################################################################
def get_domestic_price(fid_input_iscd: str, env_dv: str = "real", mrkt_div_code: str = "J"):
    """
    국내주식/ETF 현재가 시세 조회

    Args:
        fid_input_iscd: 종목코드 (예: "0072R0" = TIGER KRX금현물)
        env_dv: 실전/모의 구분 (real:실전, demo:모의)
        mrkt_div_code: 시장구분코드 (J:주식/ETF/ETN, E:ETF)
    """
    if env_dv == "real":
        tr_id = "FHKST01010100"  # 실전투자
    else:
        tr_id = "FHKST01010100"  # 모의투자 (동일 TR ID)

    params = {
        "FID_COND_MRKT_DIV_CODE": mrkt_div_code,
        "FID_INPUT_ISCD": fid_input_iscd,
    }

    res = ka._url_fetch(API_URL_PRICE, tr_id, "", params)

    if res.isOK():
        output_data = res.getBody().output
        if not isinstance(output_data, list):
            output_data = [output_data]
        df = pd.DataFrame(output_data)
        df = df.rename(columns=PRICE_COLUMN_MAPPING)

        for col in NUMERIC_COLUMNS:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        return df
    else:
        logger.error("API 호출 실패: %s - %s", res.getErrorCode(), res.getErrorMessage())
        return pd.DataFrame()


##############################################################################################
# 메인 실행
##############################################################################################
def main():
    # ===== 설정 =====
    env_dv = "real"              # "real": 실전투자, "demo": 모의투자
    fid_input_iscd = "0072R0"    # TIGER KRX금현물 ETF 종목코드

    # pandas 출력 옵션
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', None)

    # ===== 인증 =====
    logger.info("토큰 발급 중...")
    if env_dv == "real":
        ka.auth(svr='prod')    # 실전투자
    else:
        ka.auth(svr='vps')     # 모의투자
    logger.info("토큰 발급 완료")

    # ===== 현재가 조회 =====
    logger.info("=" * 60)
    logger.info("국내 ETF 현재가 조회: %s (TIGER KRX금현물)", fid_input_iscd)
    logger.info("=" * 60)
    ka.smart_sleep()

    # 시도 1: 기본 조회 (FID_COND_MRKT_DIV_CODE = "J")
    df = get_domestic_price(fid_input_iscd=fid_input_iscd, env_dv=env_dv)

    if not df.empty:
        # 주요 항목만 보기 좋게 출력
        key_cols = ['현재가', '전일대비', '전일대비율', '시가', '고가', '저가',
                    '누적거래량', '누적거래대금', '52주최고가', '52주최저가']
        available = [c for c in key_cols if c in df.columns]

        print("\n[ 전체 데이터 ]")
        print(df)

        if available:
            print("\n[ 주요 시세 요약 ]")
            print(df[available].to_string(index=False))
    else:
        # 시도 2: ETF 전용 시장구분코드로 재시도
        logger.warning("J(주식/ETF/ETN) 조회 실패 -> E(ETF) 시장구분코드로 재시도...")
        ka.smart_sleep()
        df = get_domestic_price(fid_input_iscd=fid_input_iscd, env_dv=env_dv, mrkt_div_code="E")

        if not df.empty:
            print("\n[ 전체 데이터 ]")
            print(df)
        else:
            logger.warning("조회된 데이터가 없습니다.")
            logger.warning("=" * 60)
            logger.warning("문제 해결 방법:")
            logger.warning("1. KIS Developers 포탈에서 해당 종목코드 지원 여부 확인")
            logger.warning("2. 한국투자증권 고객의 소리로 문의")
            logger.warning("   https://securities.koreainvestment.com/main/customer/support/Support.jsp")
            logger.warning("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.error("실행 오류: %s", str(e))
