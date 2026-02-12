# [해외주식] 미국주식 현재 가격 확인 샘플코드
# -*- coding: utf-8 -*-

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
API_URL_PRICE = "/uapi/overseas-price/v1/quotations/price"            # 현재체결가
API_URL_DETAIL = "/uapi/overseas-price/v1/quotations/price-detail"    # 현재가상세

# 현재체결가 컬럼 매핑
PRICE_COLUMN_MAPPING = {
    'rsym': '실시간조회종목코드',
    'zdiv': '소수점자리수',
    'base': '전일종가',
    'pvol': '전일거래량',
    'last': '현재가',
    'sign': '대비기호',
    'diff': '대비',
    'rate': '등락율',
    'tvol': '거래량',
    'tamt': '거래대금',
    'ordy': '매수가능여부'
}

# 현재가상세 컬럼 매핑
DETAIL_COLUMN_MAPPING = {
    'rsym': '실시간조회종목코드',
    'pvol': '전일거래량',
    'open': '시가',
    'high': '고가',
    'low': '저가',
    'last': '현재가',
    'base': '전일종가',
    'tomv': '시가총액',
    'h52p': '52주최고가',
    'h52d': '52주최고일자',
    'l52p': '52주최저가',
    'l52d': '52주최저일자',
    'perx': 'PER',
    'pbrx': 'PBR',
    'epsx': 'EPS',
    'bpsx': 'BPS',
    'shar': '상장주수',
    'curr': '통화',
    't_xprc': '원환산당일가격',
    't_xrat': '원환산당일등락',
    't_rate': '당일환율',
    'tvol': '거래량',
    'tamt': '거래대금',
    'e_icod': '업종(섹터)',
}

##############################################################################################
# 1) 해외주식 현재체결가 조회
##############################################################################################
def get_price(excd: str, symb: str, env_dv: str = "real"):
    """
    해외주식 현재체결가 조회

    Args:
        excd: 거래소코드 (NAS:나스닥, NYS:뉴욕, AMS:아멕스)
        symb: 종목코드 (예: AAPL, TSLA, MSFT)
        env_dv: 실전/모의 구분 (real:실전, demo:모의)
    """
    tr_id = "HHDFS00000300"  # 실전/모의 공통

    params = {
        "AUTH": "",
        "EXCD": excd,
        "SYMB": symb,
    }

    res = ka._url_fetch(API_URL_PRICE, tr_id, "", params)

    if res.isOK():
        output_data = res.getBody().output
        if not isinstance(output_data, list):
            output_data = [output_data]
        df = pd.DataFrame(output_data)
        df = df.rename(columns=PRICE_COLUMN_MAPPING)

        # 숫자형 변환
        for col in ['현재가', '전일종가', '대비', '등락율', '거래량', '거래대금']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').round(2)
        return df
    else:
        logger.error("API 호출 실패: %s - %s", res.getErrorCode(), res.getErrorMessage())
        return pd.DataFrame()


##############################################################################################
# 2) 해외주식 현재가상세 조회
##############################################################################################
def get_price_detail(excd: str, symb: str):
    """
    해외주식 현재가상세 조회 (시가/고가/저가, PER, PBR, 52주 최고/최저 등)

    Args:
        excd: 거래소코드 (NAS:나스닥, NYS:뉴욕, AMS:아멕스)
        symb: 종목코드 (예: AAPL, TSLA, MSFT)
    """
    tr_id = "HHDFS76200200"

    params = {
        "AUTH": "",
        "EXCD": excd,
        "SYMB": symb,
    }

    res = ka._url_fetch(API_URL_DETAIL, tr_id, "", params)

    if res.isOK():
        output_data = res.getBody().output
        if not isinstance(output_data, list):
            output_data = [output_data]
        df = pd.DataFrame(output_data)
        df = df.rename(columns=DETAIL_COLUMN_MAPPING)

        # 숫자형 변환
        numeric_cols = ['현재가', '시가', '고가', '저가', '전일종가', 'PER', 'PBR', 'EPS',
                        '52주최고가', '52주최저가', '원환산당일가격', '거래량']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').round(2)
        return df
    else:
        logger.error("API 호출 실패: %s - %s", res.getErrorCode(), res.getErrorMessage())
        return pd.DataFrame()


##############################################################################################
# 메인 실행
##############################################################################################
def main():
    # ===== 설정 =====
    env_dv = "real"    # "real": 실전투자, "demo": 모의투자
    excd = "NAS"       # 거래소코드 (NAS:나스닥, NYS:뉴욕, AMS:아멕스)
    symb = "AAPL"      # 종목코드 (예: AAPL, TSLA, MSFT, NVDA, GOOGL)

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

    # ===== 1) 현재체결가 조회 =====
    logger.info("=" * 60)
    logger.info("[1] 해외주식 현재체결가 조회: %s (%s)", symb, excd)
    logger.info("=" * 60)
    ka.smart_sleep()
    df_price = get_price(excd=excd, symb=symb, env_dv=env_dv)

    if not df_price.empty:
        print(df_price)
        print()
    else:
        logger.warning("현재체결가 데이터가 없습니다.")

    # ===== 2) 현재가상세 조회 =====
    logger.info("=" * 60)
    logger.info("[2] 해외주식 현재가상세 조회: %s (%s)", symb, excd)
    logger.info("=" * 60)
    ka.smart_sleep()
    df_detail = get_price_detail(excd=excd, symb=symb)

    if not df_detail.empty:
        print(df_detail)
    else:
        logger.warning("현재가상세 데이터가 없습니다.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.error("실행 오류: %s", str(e))
