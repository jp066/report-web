import xml.etree.ElementTree as ET
import requests
from app.schemas.env_schema import settings

URL = settings.TOTVS_URL
AUTH = (settings.TOTVS_USERNAME, settings.TOTVS_PASSWORD)


def report_list():
    xml_text = """
   <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
      <soapenv:Header/>
      <soapenv:Body>
         <tot:GetReportList>
            <tot:codColigada>1</tot:codColigada>
         </tot:GetReportList>
      </soapenv:Body>
   </soapenv:Envelope>
    """

    headers = {
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "text/xml;charset=UTF-8",
        "SOAPAction": '"http://www.totvs.com/IwsReport/GetReportList"',
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
            f"Erro ao obter a lista de relatórios: Status code {response.status_code}")

    root = ET.fromstring(response.text)

    # Verifica se há SOAP Fault
    fault = root.find('.//{http://schemas.xmlsoap.org/soap/envelope/}Fault')
    if fault is not None:
        faultstring = fault.find(
            './/{http://schemas.xmlsoap.org/soap/envelope/}faultstring')
        if faultstring is None:
            faultstring = fault.find('.//faultstring')
        error_message = faultstring.text if faultstring is not None else "Erro desconhecido"
        print(f"SOAP Fault detectado: {error_message}")
        print(
            f"XML do Fault completo: {ET.tostring(fault, encoding='unicode')}")
        raise RuntimeError(f"Erro do TOTVS: {error_message}")

    ns = {
        "s": "http://schemas.xmlsoap.org/soap/envelope/",
        "t": "http://www.totvs.com/"
    }

    result_elem = root.find(".//t:GetReportListResult", ns)

    if result_elem is None or result_elem.text is None:
        print("GetReportListResult não encontrado ou vazio na resposta")
        raise RuntimeError("Lista de relatórios não disponível no TOTVS")

    result = result_elem.text
    records = [r for r in result.split(";") if r.strip()]

    parsed = []
    for record in records:
        fields = record.split(",")
        item = {
            "codigo_sistema": fields[0],
            "nome_sistema": fields[1],
            "id_interno": fields[2],
            "codigo_relatorio": fields[3],
            "nome_relatorio": fields[4],
            "data_atualizacao": fields[5],
            "guid": fields[6],
        }
        parsed.append(item)

    return parsed


def formatted_report_list():
    reports = report_list()
    for r in reports:
        if not r["id_interno"] or not r["nome_relatorio"]:
            raise ValueError("Relatório com dados incompletos encontrado")
    formatted = [{"id_report": r["id_interno"],
                  "report_name": r["nome_relatorio"]} for r in reports]
    return formatted