import xml.etree.ElementTree as ET
import requests
from app.schemas.env_schema import settings

URL = settings.TOTVS_URL
AUTH = (settings.TOTVS_USERNAME, settings.TOTVS_PASSWORD)

def get_file_size(guid: str) -> str:
   result = None
   xml_text = f"""
   <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
      <soapenv:Header/>
      <soapenv:Body>
         <tot:GetGeneratedReportSize>
            <tot:guid>{guid}</tot:guid>
         </tot:GetGeneratedReportSize>
      </soapenv:Body>
   </soapenv:Envelope>
   """
   
   headers = {
   "Accept-Encoding": "gzip, deflate",
   "Content-Type": "text/xml;charset=UTF-8",
   "SOAPAction": '"http://www.totvs.com/IwsReport/GetGeneratedReportSize"',
   "Authorization": settings.AUTH_HARDCODED,
   "Content-Length": str(len(xml_text)),
   "Host": "bbsltda149898.rm.cloudtotvs.com.br:8051",
   "Connection": "Keep-Alive",
   "User-Agent": requests.utils.default_user_agent(),
}

   resp = requests.post(URL, data=xml_text, headers=headers, auth=AUTH, verify=settings.SOAP_VERIFY_SSL)
   parser_xml = ET.fromstring(resp.content)
   for element in parser_xml.iter():
        if element.tag.endswith('GetGeneratedReportSizeResult'):
           result = (element.text or '').strip()
           break
   if result is None:
        raise RuntimeError("Resultado não encontrado na resposta")
   print(result)
   return result