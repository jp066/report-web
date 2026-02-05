import requests
import xml.etree.ElementTree as ET
from app.schemas.env_schema import settings
from app.schemas.env_schema import settings
import logging

URL = settings.TOTVS_URL
AUTH = (settings.TOTVS_USERNAME, settings.TOTVS_PASSWORD)

def definer_params(**parameters):
    params_xml = ""
    for key, value in parameters.items():
      value_str = "" if value is None else str(value)
      param_xml = f"""
      <RptParameterReportPar>
      <Description>{key}</Description>
      <ParamName>{key}</ParamName>
      <Type xmlns:d3p1="http://schemas.datacontract.org/2004/07/System" xmlns:d3p2="-mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089-System-System.RuntimeType" i:type="d3p2:RuntimeType" xmlns:d3p3="-mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089-System-System.UnitySerializationHolder" z:FactoryType="d3p3:UnitySerializationHolder" xmlns:z="http://schemas.microsoft.com/2003/10/Serialization/">
        <Data xmlns:d4p1="http://www.w3.org/2001/XMLSchema" i:type="d4p1:string" xmlns="">System.String</Data>
        <UnityType xmlns:d4p1="http://www.w3.org/2001/XMLSchema" i:type="d4p1:int" xmlns="">4</UnityType>
        <AssemblyName xmlns:d4p1="http://www.w3.org/2001/XMLSchema" i:type="d4p1:string" xmlns="">mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</AssemblyName>
      </Type>
      <Value xmlns:d3p1="http://www.w3.org/2001/XMLSchema" i:type="d3p1:string">{value_str}</Value>
      <Visible>true</Visible>
      </RptParameterReportPar>
        """
      params_xml += param_xml
    return params_xml


def generate_report(id_report, **parameters):
    parameters = definer_params(**parameters)
    xml_generate = f"""
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
     <soapenv:Header/>
     <soapenv:Body>
        <tot:GenerateReport>
           <!--Optional:-->
           <tot:id>{id_report}</tot:id>
           <!--Optional:-->
           <tot:filters><![CDATA[<?xml version="1.0" encoding="utf-16"?>
<ArrayOfRptFilterReportPar xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.totvs.com.br/RM/">
  <RptFilterReportPar>
    <BandName></BandName>
    <FiltersByTable />
    <MainFilter>true</MainFilter>
    <Value></Value>
  </RptFilterReportPar>
</ArrayOfRptFilterReportPar>]]></tot:filters>
           <!--Optional:-->
           <tot:parameters><![CDATA[<?xml version="1.0" encoding="utf-16"?>
  <ArrayOfRptParameterReportPar xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.totvs.com.br/RM/">
    {parameters}
  </ArrayOfRptParameterReportPar>]]></tot:parameters>
           <!--Optional:-->
           <tot:fileName>Report{ id_report }.pdf</tot:fileName>
           <!--Optional:-->
           <tot:contexto>CodColigada=1;CodFilial=1</tot:contexto>
        </tot:GenerateReport>
     </soapenv:Body>
  </soapenv:Envelope>
  """

    headers = {
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "text/xml;charset=UTF-8",
        "SOAPAction": '"http://www.totvs.com/IwsReport/GenerateReport"',
        "Authorization": settings.AUTH_HARDCODED,
        "Content-Length": str(len(xml_generate)),
        "Host": "bbsltda149898.rm.cloudtotvs.com.br:8051",
        "Connection": "Keep-Alive",
        "User-Agent": requests.utils.default_user_agent(),
    }

    resp = requests.post(URL, data=xml_generate, headers=headers, auth=AUTH, verify=settings.SOAP_VERIFY_SSL)
    logger = logging.getLogger("uvicorn.error")
    logger.info(f"Status Code: {resp.status_code}")

    parser_xml = ET.fromstring(resp.content)

    # Verifica se é um SOAP Fault (erro)
    fault = parser_xml.find(
        './/{http://schemas.xmlsoap.org/soap/envelope/}Fault')
    if fault is not None:
        faultstring = fault.find('.//faultstring')
        error_message = faultstring.text if faultstring is not None else "Erro desconhecido no serviço TOTVS"
        logger.error(f"SOAP Fault recebido: {error_message}")
        raise RuntimeError(f"Erro do TOTVS: {error_message}")

    # Log de todos os elementos encontrados (apenas em caso de sucesso)
    logger.info("Resposta XML recebida do TOTVS: %s", resp.content)
    logger.info("Elementos encontrados no XML:")
    for element in parser_xml.iter():
        logger.info(
            f"  Tag: {element.tag}, Text: {(element.text or '')[:100]}")

    guid = None
    for element in parser_xml.iter():  # percorre todos os elementos do XML
        if element.tag.endswith('GenerateReportResult'):
            guid = (element.text or '').strip()
            break

    if guid is None:
        raise RuntimeError("GenerateReportResult não encontrado na resposta")
      
    result_text = guid

    if "Object reference not set to an instance of an object." in result_text:
      raise RuntimeError(f"Erro do TOTVS ao gerar relatório: {result_text}")

    logger.info(f"GUID gerado com sucesso: {guid}")
    return guid