import requests
import xml.etree.ElementTree as ET

URL = "https://bbsltda149898.rm.cloudtotvs.com.br:8051/wsReport/IwsReport"
AUTH = ("mestre", "123t0tvs") # alterar isso aqui.

def generate_report(id_report):
  xml_generate = f"""
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
     <soapenv:Header/>
     <soapenv:Body>
        <tot:GenerateReport>
           <!--Optional:-->
           <tot:codColigada>1</tot:codColigada>
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
    <RptParameterReportPar>
      <Description>PARAM_COLIGADA</Description>
      <ParamName>PARAM_COLIGADA</ParamName>
      <Type xmlns:d3p1="http://schemas.datacontract.org/2004/07/System" xmlns:d3p2="-mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089-System-System.RuntimeType" i:type="d3p2:RuntimeType" xmlns:d3p3="-mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089-System-System.UnitySerializationHolder" z:FactoryType="d3p3:UnitySerializationHolder" xmlns:z="http://schemas.microsoft.com/2003/10/Serialization/">
        <Data xmlns:d4p1="http://www.w3.org/2001/XMLSchema" i:type="d4p1:string" xmlns="">System.String</Data>
        <UnityType xmlns:d4p1="http://www.w3.org/2001/XMLSchema" i:type="d4p1:int" xmlns="">4</UnityType>
        <AssemblyName xmlns:d4p1="http://www.w3.org/2001/XMLSchema" i:type="d4p1:string" xmlns="">mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</AssemblyName>
      </Type>
      <Value xmlns:d3p1="http://www.w3.org/2001/XMLSchema" i:type="d3p1:string">1</Value>
      <Visible>true</Visible>
    </RptParameterReportPar>
    <RptParameterReportPar>
      <Description>PARAM_TESTE</Description>
      <ParamName>PARAM_TESTE</ParamName>
      <Type xmlns:d3p1="http://schemas.datacontract.org/2004/07/System" xmlns:d3p2="-mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089-System-System.RuntimeType" i:type="d3p2:RuntimeType" xmlns:d3p3="-mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089-System-System.UnitySerializationHolder" z:FactoryType="d3p3:UnitySerializationHolder" xmlns:z="http://schemas.microsoft.com/2003/10/Serialization/">
        <Data xmlns:d4p1="http://www.w3.org/2001/XMLSchema" i:type="d4p1:string" xmlns="">System.String</Data>
        <UnityType xmlns:d4p1="http://www.w3.org/2001/XMLSchema" i:type="d4p1:int" xmlns="">4</UnityType>
        <AssemblyName xmlns:d4p1="http://www.w3.org/2001/XMLSchema" i:type="d4p1:string" xmlns="">mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</AssemblyName>
      </Type>
      <Value xmlns:d3p1="http://www.w3.org/2001/XMLSchema" i:type="d3p1:string">1</Value>
      <Visible>true</Visible>
    </RptParameterReportPar>
  </ArrayOfRptParameterReportPar>]]></tot:parameters>
           <!--Optional:-->
           <tot:fileName>Report.pdf</tot:fileName>
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
      "Authorization": "Basic bWVzdHJlOjEyM3QwdHZz",
      "Content-Length": str(len(xml_generate)),
      "Host": "bbsltda149898.rm.cloudtotvs.com.br:8051",
      "Connection": "Keep-Alive",
      "User-Agent": requests.utils.default_user_agent(),
  }

  resp = requests.post(URL, data=xml_generate, headers=headers, auth=AUTH, verify=False)
  parser_xml = ET.fromstring(resp.content)
  guid = None
  for element in parser_xml.iter(): # percorre todos os elementos do XML
      if element.tag.endswith('GenerateReportResult'):
          guid = (element.text or '').strip() # extrai o texto do elemento e remove espaços em branco
          break
  if guid is None:
      raise RuntimeError("GenerateReportResult não encontrado na resposta")
  print(parser_xml)
  return guid