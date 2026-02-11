import logging
import html
import xml.etree.ElementTree as ET
import requests
from app.schemas.env_schema import settings

URL = settings.TOTVS_URL
AUTH = (settings.TOTVS_USERNAME, settings.TOTVS_PASSWORD)


def metadata_report(codColigada: int, idReport: int):
    xml_text = f"""
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
       <soapenv:Header/>
       <soapenv:Body>
          <tot:GetReportInfo>
             <tot:codColigada>{codColigada}</tot:codColigada>
             <tot:idReport>{idReport}</tot:idReport>
          </tot:GetReportInfo>
       </soapenv:Body>
    </soapenv:Envelope>
    """

    logger = logging.getLogger("uvicorn.error")
    logger.info(
        "Enviando GetReportInfo para TOTVS: codColigada=%s idReport=%s", codColigada, idReport)

    headers = {
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "text/xml;charset=UTF-8",
        "SOAPAction": '"http://www.totvs.com/IwsReport/GetReportInfo"',
        "Authorization": settings.AUTH_HARDCODED,
        "Content-Length": str(len(xml_text)),
        "Host": "bbsltda149898.rm.cloudtotvs.com.br:8051",
        "Connection": "Keep-Alive",
        "User-Agent": requests.utils.default_user_agent()
    }

    response = requests.post(URL, auth=AUTH, data=xml_text,
                             headers=headers, verify=settings.SOAP_VERIFY_SSL)

    print(f"Status Code: {response.status_code}")
    print(f"Response Text (primeiros 500 chars): {response.text[:500]}")

    if response.status_code not in [200, 202]:
        raise RuntimeError(
            f"Erro ao obter os metadados do relatório: Status code {response.status_code}")

    root = ET.fromstring(response.text)

    # Verifica se há SOAP Fault
    fault = root.find('.//{http://schemas.xmlsoap.org/soap/envelope/}Fault')
    if fault is not None:
        faultstring = fault.find(
            './/{http://schemas.xmlsoap.org/soap/envelope/}faultstring')
        if faultstring is None:
            faultstring = fault.find('.//faultstring')
        error_message = faultstring.text if faultstring is not None else "Erro desconhecido"
        logger.error(f"SOAP Fault detectado: {error_message}")
        logger.debug(
            f"XML do Fault completo: {ET.tostring(fault, encoding='unicode')}")
        raise RuntimeError(f"Erro do TOTVS: {error_message}")

    ns = {
        "s": "http://schemas.xmlsoap.org/soap/envelope/",
        "t": "http://www.totvs.com/"
    }

    # procura o elemento que contém o resultado
    result_elem = root.find(".//t:GetReportInfoResult", ns)
    if result_elem is None:
        logger.error("GetReportInfoResult não encontrado na resposta SOAP")
        raise RuntimeError("Metadados do relatório não disponíveis no TOTVS")

    # o TOTVS às vezes retorna um array de strings (<a:string>) onde cada string
    # contém um XML (geralmente ArrayOfRptFilterReportPar e ArrayOfRptParameterReportPar).
    # Tratamos ambos os casos: texto direto ou array de strings.
    arr_ns = {
        **ns,
        "a": "http://schemas.microsoft.com/2003/10/Serialization/Arrays"
    }

    string_nodes = result_elem.findall('.//a:string', arr_ns)

    inner_roots = []
    if string_nodes:
        for s in string_nodes:
            raw = s.text or ""
            # o conteúdo pode vir escapado (com &lt; etc.) — desfazermos essas entidades
            raw = html.unescape(raw).strip()
            if not raw:
                continue
            try:
                inner_root = ET.fromstring(raw)
                inner_roots.append(inner_root)
            except Exception as e:
                logger.error(
                    "Erro ao parsear bloco interno de GetReportInfoResult: %s", e)
                logger.debug("Bloco cru: %s", raw)
                # continuar para tentar processar outros blocos
    else:
        # Tentar extrair texto direto do elemento (formato antigo)
        raw = (result_elem.text or "").strip()
        if not raw:
            logger.error(
                "GetReportInfoResult vazio (sem texto e sem elementos a:string)")
            raise RuntimeError(
                "Metadados do relatório não disponíveis no TOTVS")
        raw = html.unescape(raw)
        try:
            inner_roots.append(ET.fromstring(raw))
        except Exception as e:
            logger.error(
                "Erro ao parsear GetReportInfoResult como XML direto: %s", e)
            logger.debug("Conteúdo cru: %s", raw)
            raise RuntimeError(
                "Metadados do relatório não disponíveis no TOTVS")

    # juntamos os blocos internos sob um root comum para facilitar buscas
    combined = ET.Element('Combined')
    for r in inner_roots:
        combined.append(r)

    return combined
