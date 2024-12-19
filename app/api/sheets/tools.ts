import { DynamicTool } from "@langchain/core/tools";
import { LanguageDetector } from "@/lib/languageDetector";

export class GoogleSheetsTools {
  private baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  private sheetId: string;
  private language: string;
  private languageDetector: LanguageDetector;
  private accessToken: string;

  constructor(accessToken: string, sheetId: string | null, language: string = 'en') {
    this.accessToken = accessToken;
    this.sheetId = sheetId || '';
    this.language = language;
    this.languageDetector = new LanguageDetector();
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async formatResponse(response: any, operation: string): Promise<string> {
    // Get language name for better context
    const languageName = this.languageDetector.getLanguageName(this.language);

    // Format response based on operation type and language
    switch (operation) {
      case 'read':
        return this.formatReadResponse(response, languageName);
      case 'write':
        return this.formatWriteResponse(response, languageName);
      case 'analyze':
        return this.formatAnalyzeResponse(response, languageName);
      default:
        return JSON.stringify(response);
    }
  }

  private formatReadResponse(response: any, languageName: string): string {
    const responseTemplates: { [key: string]: string } = {
      en: `Data retrieved successfully. Found ${response.values?.length || 0} rows.`,
      ko: `데이터를 성공적으로 가져왔습니다. ${response.values?.length || 0}개의 행을 찾았습니다.`,
      ja: `データの取得に成功しました。${response.values?.length || 0}行が見つかりました。`,
      zh: `数据检索成功。找到${response.values?.length || 0}行。`,
      // Add more languages as needed
    };

    return responseTemplates[this.language] || responseTemplates['en'];
  }

  private formatWriteResponse(response: any, languageName: string): string {
    const responseTemplates: { [key: string]: string } = {
      en: 'Data written successfully to the sheet.',
      ko: '시트에 데이터를 성공적으로 작성했습니다.',
      ja: 'シートへのデータの書き込みが成功しました。',
      zh: '数据已成功写入表格。',
      // Add more languages as needed
    };

    return responseTemplates[this.language] || responseTemplates['en'];
  }

  private formatAnalyzeResponse(response: any, languageName: string): string {
    const analysisResults = this.generateSummary(response.values || []);
    
    const responseTemplates: { [key: string]: string } = {
      en: `Analysis complete. ${analysisResults}`,
      ko: `분석 완료. ${analysisResults}`,
      ja: `分析が完了しました。${analysisResults}`,
      zh: `分析完成。${analysisResults}`,
      // Add more languages as needed
    };

    return responseTemplates[this.language] || responseTemplates['en'];
  }

  getReadSheetTool(): DynamicTool {
    return new DynamicTool({
      name: "read_sheet",
      description: "Reads data from a specific range in the current Google Sheet. Input should be a JSON string with a 'range' property in A1 notation.",
      func: async (input: string) => {
        try {
          const { range } = JSON.parse(input);
          if (!this.sheetId) {
            throw new Error('No sheet selected');
          }
          const response = await this.makeRequest(`/${this.sheetId}/values/${range}`);
          return this.formatResponse(response, 'read');
        } catch (error: any) {
          const errorMessages: { [key: string]: string } = {
            en: `Error reading sheet: ${error.message}`,
            ko: `시트 읽기 오류: ${error.message}`,
            ja: `シートの読み取りエラー: ${error.message}`,
            zh: `读取表格错误: ${error.message}`,
          };
          return errorMessages[this.language] || errorMessages['en'];
        }
      },
    });
  }

  getWriteSheetTool(): DynamicTool {
    return new DynamicTool({
      name: "write_sheet",
      description: "Writes data to a specific range in the current Google Sheet. Input should be a JSON string with 'range' and 'values' properties.",
      func: async (input: string) => {
        try {
          const { range, values } = JSON.parse(input);
          if (!this.sheetId) {
            throw new Error('No sheet selected');
          }
          const response = await this.makeRequest(
            `/${this.sheetId}/values/${range}`,
            'PUT',
            {
              range,
              values,
              valueInputOption: 'USER_ENTERED',
            }
          );
          return this.formatResponse(response, 'write');
        } catch (error: any) {
          const errorMessages: { [key: string]: string } = {
            en: `Error writing to sheet: ${error.message}`,
            ko: `시트 쓰기 오류: ${error.message}`,
            ja: `シートへの書き込みエラー: ${error.message}`,
            zh: `写入表格错误: ${error.message}`,
          };
          return errorMessages[this.language] || errorMessages['en'];
        }
      },
    });
  }

  getAnalyzeSheetTool(): DynamicTool {
    return new DynamicTool({
      name: "analyze_sheet",
      description: "Analyzes data in a specific range of the current Google Sheet. Input should be a JSON string with a 'range' property in A1 notation.",
      func: async (input: string) => {
        try {
          const { range } = JSON.parse(input);
          if (!this.sheetId) {
            throw new Error('No sheet selected');
          }
          const response = await this.makeRequest(`/${this.sheetId}/values/${range}`);
          return this.formatResponse(response, 'analyze');
        } catch (error: any) {
          const errorMessages: { [key: string]: string } = {
            en: `Error analyzing sheet: ${error.message}`,
            ko: `시트 분석 오류: ${error.message}`,
            ja: `シートの分석エラー: ${error.message}`,
            zh: `分析表格错误: ${error.message}`,
          };
          return errorMessages[this.language] || errorMessages['en'];
        }
      },
    });
  }

  getCreateSheetTool(): DynamicTool {
    return new DynamicTool({
      name: "create_sheet",
      description: "Creates a new Google Sheet. Input should be a JSON string with a 'title' property for the new sheet name.",
      func: async (input: string) => {
        try {
          const { title } = JSON.parse(input);
          const response = await this.makeRequest(
            '',
            'POST',
            {
              properties: {
                title: title || 'Untitled Spreadsheet',
              },
            }
          );

          const sheetInfo = {
            id: response.spreadsheetId,
            url: `https://docs.google.com/spreadsheets/d/${response.spreadsheetId}`,
            title: response.properties.title
          };

          const responseTemplates: { [key: string]: string } = {
            en: `New sheet "${sheetInfo.title}" created successfully.\nURL: ${sheetInfo.url}`,
            ko: `새 시트 "${sheetInfo.title}"가 성공적으로 생성되었습니다.\nURL: ${sheetInfo.url}`,
            ja: `新しいシート"${sheetInfo.title}"が正常に作成されました。\nURL: ${sheetInfo.url}`,
            zh: `新表格"${sheetInfo.title}"创建成功。\nURL: ${sheetInfo.url}`,
          };

          return {
            message: responseTemplates[this.language] || responseTemplates['en'],
            sheetInfo
          };
        } catch (error: any) {
          const errorMessages: { [key: string]: string } = {
            en: `Error creating sheet: ${error.message}`,
            ko: `시트 생성 오류: ${error.message}`,
            ja: `シート作成エラー: ${error.message}`,
            zh: `创建表格错误: ${error.message}`,
          };
          return errorMessages[this.language] || errorMessages['en'];
        }
      },
    });
  }

  private generateSummary(values: any[][]): string {
    if (!values || values.length < 2) {
      const emptyMessages: { [key: string]: string } = {
        en: 'No data available for analysis.',
        ko: '분석할 데이터가 없습니다.',
        ja: '分析するデータがありません。',
        zh: '没有可分析的数据。',
      };
      return emptyMessages[this.language] || emptyMessages['en'];
    }
    
    const headers = values[0];
    const data = values.slice(1);
    const summary: any = {};

    headers.forEach((header: string, index: number) => {
      const column = data.map(row => row[index]);
      const numericValues = column
        .filter(val => !isNaN(parseFloat(val)))
        .map(val => parseFloat(val));

      if (numericValues.length > 0) {
        const numericSummary = {
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          average: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
          numericCount: numericValues.length,
        };

        const summaryTemplates: { [key: string]: string } = {
          en: `Column ${header}: Min=${numericSummary.min}, Max=${numericSummary.max}, Avg=${numericSummary.average.toFixed(2)}`,
          ko: `${header} 열: 최소=${numericSummary.min}, 최대=${numericSummary.max}, 평균=${numericSummary.average.toFixed(2)}`,
          ja: `${header}列: 最小=${numericSummary.min}, 最大=${numericSummary.max}, 平均=${numericSummary.average.toFixed(2)}`,
          zh: `${header}列: 最小值=${numericSummary.min}, 最大值=${numericSummary.max}, 平均值=${numericSummary.average.toFixed(2)}`,
        };

        summary[header] = summaryTemplates[this.language] || summaryTemplates['en'];
      } else {
        const uniqueValues = new Set(column.filter(Boolean));
        const textSummary = {
          uniqueValues: uniqueValues.size,
          mostCommon: this.getMostCommonValue(column),
          emptyCount: column.filter(val => !val).length,
        };

        const summaryTemplates: { [key: string]: string } = {
          en: `Column ${header}: ${uniqueValues.size} unique values, Most common: ${textSummary.mostCommon}`,
          ko: `${header} 열: ${uniqueValues.size}개의 고유값, 가장 흔한 값: ${textSummary.mostCommon}`,
          ja: `${header}列: ${uniqueValues.size}個のユニ���ク値, 最も一般的: ${textSummary.mostCommon}`,
          zh: `${header}列: ${uniqueValues.size}个唯一值, 最常见: ${textSummary.mostCommon}`,
        };

        summary[header] = summaryTemplates[this.language] || summaryTemplates['en'];
      }
    });

    return Object.values(summary).join('\n');
  }

  private getMostCommonValue(arr: any[]): any {
    const counts = arr.reduce((acc: any, val: any) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts)
      .sort(([,a]: any, [,b]: any) => b - a)[0][0];
  }
} 