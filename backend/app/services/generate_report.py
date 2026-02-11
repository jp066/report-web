import requests
import xml.etree.ElementTree as ET
from app.schemas.env_schema import settings
from app.schemas.env_schema import settings
import logging

logger = logging.getLogger("uvicorn.error")

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


def generate_report(id_report, codColigada, **parameters):
    logger.info("Gerando relatório: id=%s codColigada=%s parameters_keys=%s", id_report, codColigada, list(parameters.keys()))
    parameters = definer_params(**parameters)
    xml_generate = f"""<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
     <soapenv:Header/>
     <soapenv:Body>
        <tot:GenerateReport>
           <!--Optional:-->
           <tot:codColigada>{codColigada}</tot:codColigada>
           <!--Optional:-->
           <tot:id>{id_report}</tot:id>
           <!--Optional:-->
           <tot:filters><![CDATA[<?xml version="1.0" encoding="utf-16"?>
  <ArrayOfRptFilterReportPar xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.totvs.com.br/RM/">
    <RptFilterReportPar>
      <BandName>RptReport</BandName>
      <FiltersByTable>
        <RptFilterByTablePar>
          <Filter>PFUNC.CHAPA &gt;= '00001' AND
  PFUNC.CHAPA &lt;= '00010'
  </Filter>
          <TableName>PFUNC</TableName>
        </RptFilterByTablePar>
      </FiltersByTable>
      <MainFilter>true</MainFilter>
      <Value>(PFUNC.CHAPA &gt;= '00001' AND
  PFUNC.CHAPA &lt;= '00010')</Value>
    </RptFilterReportPar>
  </ArrayOfRptFilterReportPar>]]></tot:filters>
           <!--Optional:-->
           <tot:parameters><![CDATA[<?xml version="1.0" encoding="utf-16"?>
  <ArrayOfRptParameterReportPar xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.totvs.com.br/RM/">
  {parameters}
  </ArrayOfRptParameterReportPar>]]></tot:parameters>
           <!--Optional:-->
           <tot:fileName>Report.pdf</tot:fileName>
           <!--Optional:-->
           <tot:contexto>codColigada=1;CodFilial=1</tot:contexto>
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
    try:
        logger.debug(
            "Enviando GenerateReport (tamanho do XML=%s bytes)", len(xml_generate))
        resp = requests.post(URL, data=xml_generate, headers=headers,
                             auth=AUTH, verify=settings.SOAP_VERIFY_SSL, timeout=60)
        logger.info("GenerateReport HTTP status: %s", resp.status_code)
        logger.debug("Response preview: %s", (resp.text or '')[:1000])
    except Exception as e:
        logger.exception("Erro HTTP ao enviar GenerateReport: %s", e)
        raise

    try:
        parser_xml = ET.fromstring(resp.content)
    except Exception as e:
        logger.exception(
            "Erro ao parsear XML de resposta do GenerateReport: %s", e)
        logger.debug("Resposta bruta (bytes): %s", resp.content)
        raise RuntimeError(
            "Resposta XML inválida do TOTVS ao gerar relatório") from e

        # Verifica se é um SOAP Fault (erro)
        fault = parser_xml.find(
            './/{http://schemas.xmlsoap.org/soap/envelope/}Fault')
        if fault is not None:
            faultstring = fault.find('.//faultstring')
            error_message = faultstring.text if faultstring is not None else "Erro desconhecido no serviço TOTVS"
            logger.error(f"SOAP Fault recebido: {error_message}")
            raise RuntimeError(f"Erro do TOTVS: {error_message}")

    # Log de todos os elementos encontrados (apenas em caso de sucesso)
    logger.debug("Resposta XML completa recebida do TOTVS (len=%s)",
                 len(resp.content or b""))
    logger.debug("Elementos encontrados no XML:")
    for element in parser_xml.iter():
        logger.debug("  Tag: %s, Text: %s", element.tag,
                     (element.text or '')[:200])

    guid = None
    for element in parser_xml.iter():  # percorre todos os elementos do XML
        try:
            if element.tag.endswith('GenerateReportResult'):
                guid = (element.text or '').strip()
                break
        except Exception:
            # continue se algum node inesperado
            continue

    if guid is None:
        logger.error("GenerateReportResult não encontrado na resposta XML")
        raise RuntimeError("GenerateReportResult não encontrado na resposta")

    result_text = guid

    if "Object reference not set to an instance of an object." in result_text:
        logger.error("Erro do TOTVS ao gerar relatório: %s", result_text)
        raise RuntimeError(f"Erro do TOTVS ao gerar relatório: {result_text}")

    logger.info("GUID gerado com sucesso: %s", guid)
    return guid
