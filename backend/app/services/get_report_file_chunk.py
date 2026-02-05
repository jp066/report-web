import xml.etree.ElementTree as ET
import requests
from app.schemas.report_schema import Report
from app.schemas.env_schema import settings

URL = settings.TOTVS_URL
AUTH = (settings.TOTVS_USERNAME, settings.TOTVS_PASSWORD)


def get_file_chunk(guid: str, size: int) -> Report:
    result = None
    xml_text = f"""
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
       <soapenv:Header/>
       <soapenv:Body>
          <tot:GetFileChunk>
             <!--Optional:-->
             <tot:guid>{guid}</tot:guid>
             <!--Optional:-->
             <tot:offset>0</tot:offset>
             <!--Optional:-->
             <tot:length>{size}</tot:length>
          </tot:GetFileChunk>
       </soapenv:Body>
    </soapenv:Envelope>
   """
    headers = {
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "text/xml;charset=UTF-8",
        "SOAPAction": '"http://www.totvs.com/IwsReport/GetFileChunk"',
        "Authorization": settings.AUTH_HARDCODED,
        "Content-Length": str(len(xml_text)),
        "Host": "bbsltda149898.rm.cloudtotvs.com.br:8051",
        "Connection": "Keep-Alive",
        "User-Agent": requests.utils.default_user_agent(),
    }
    try:
        resp = requests.post(URL, data=xml_text, headers=headers,
                             auth=AUTH, verify=settings.SOAP_VERIFY_SSL)
        print("Response status code:", resp.status_code)
        print("Response content (primeiros 500 chars):", resp.content[:500])

        parser_xml = ET.fromstring(resp.content)

        # Verifica se tem SOAP Fault
        fault = parser_xml.find(
            './/{http://schemas.xmlsoap.org/soap/envelope/}Fault')
        if fault is not None:
            faultstring = fault.find(
                './/{http://schemas.xmlsoap.org/soap/envelope/}faultstring')
            error_message = faultstring.text if faultstring is not None else "Erro desconhecido"
            print(f"SOAP Fault detectado: {error_message}")
            raise RuntimeError(f"Erro do TOTVS: {error_message}")

        # Busca o resultado
        for element in parser_xml.iter():
            if element.tag.endswith('GetFileChunkResult'):
                result = (element.text or '').strip()
                print(
                    f"Chunk encontrado, tamanho: {len(result) if result else 0}")
                break

        if result is None:
            print("GetFileChunkResult não encontrado na resposta")

    except Exception as e:
        raise RuntimeError(f"Erro ao obter o chunk do arquivo: {str(e)}")

    return result
