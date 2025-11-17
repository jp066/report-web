import xml.etree.ElementTree as ET
import requests

URL = "https://bbsltda149898.rm.cloudtotvs.com.br:8051/wsReport/IwsReport"
AUTH = ("mestre", "123t0tvs")

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
   "Authorization": "Basic bWVzdHJlOjEyM3QwdHZz",
   "Content-Length": str(len(xml_text)),
   "Host": "bbsltda149898.rm.cloudtotvs.com.br:8051",
   "Connection": "Keep-Alive",
   "User-Agent": requests.utils.default_user_agent(),
}

   resp = requests.post(URL, data=xml_text, headers=headers, auth=AUTH, verify=False)
   parser_xml = ET.fromstring(resp.content)
   for element in parser_xml.iter():
        if element.tag.endswith('GetGeneratedReportSizeResult'):
           result = (element.text or '').strip()
           break
   if result is None:
        raise RuntimeError("GetGeneratedReportSizeResult não encontrado na resposta")
   print(result)
   return result