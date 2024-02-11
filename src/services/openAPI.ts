import axios from "axios";
import { config } from '../config'
import { randomUUID } from "crypto";
import { OpenAIResponseLogEntity } from "../domain/entities";
import { OpenAIResponseLog } from "../models/OpenAIResponseLog";

const { apiKey, model, maxPrompt } = config.openAI

const chatCompletionExampleResponse = {
  "id": "chatcmpl-7LrvNc9NTLi9C7tmhrbEgt1SiuL9z",
  "object": "chat.completion",
  "created": 1685446529,
  "model": "gpt-4-0314",
  "usage": {
    "prompt_tokens": 1584,
    "completion_tokens": 675,
    "total_tokens": 2259
  },
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Objet: Modification du contrat de vente d'adjuvants\n\nDOCUMENTS CONTRACTUELS: Le présent avenant au contrat de vente du 01/01/2021 et le contrat de vente initial signé entre les parties le 01 janvier 2021.\n\nPRISE D’EFFET – DUREE/Date d'effet: Cet avenant entre en vigueur à partir du 1 janvier 2022.\n\nPRISE D’EFFET – DUREE/Durée: La durée du contrat est indéterminée, mais les prix mentionnés dans l'avenant demeurent fermes et non révisables jusqu'au 31/12/2022.\n\nPRISE D’EFFET – DUREE/Reconduction: Non mentionné dans l'avenant.\n\nSUPPORT – DISPONIBILITE - MAINTENANCE/Support: Non mentionné dans l'avenant.\n\nSUPPORT – DISPONIBILITE - MAINTENANCE/Disponiblité: Non mentionné dans l'avenant.\n\nSUPPORT – DISPONIBILITE - MAINTENANCE/Maintenance préventive: Non mentionné dans l'avenant.\n\nSUPPORT – DISPONIBILITE - MAINTENANCE/Maintenance Corrective: Non mentionné dans l'avenant.\n\nSUPPORT – DISPONIBILITE - MAINTENANCE/Maintenance évolutive - Mises à jour & Evolutions (Updates & Upgrades): Non mentionné dans l'avenant.\n\nLOCALISATION DES DONNEES ET PROPRIETE DES DONNEES/LOCALISATION DES DONNEES S: Non mentionné dans l'avenant.\n\nLOCALISATION DES DONNEES ET PROPRIETE DES DONNEES/Propriéte des données: Non mentionné dans l'avenant.\n\nCOORDINATION DU CONTRAT ET SUIVI DES PRESTATIONS/Obligation de loyauté: Non mentionné dans l'avenant.\n\nCOORDINATION DU CONTRAT ET SUIVI DES PRESTATIONS/Obligation de Collaboration: Non mentionné dans l'avenant.\n\nCOORDINATION DU CONTRAT ET SUIVI DES PRESTATIONS/Suivi du contrat: Non mentionné dans l'avenant.\n\nCOORDINATION DU CONTRAT ET SUIVI DES PRESTATIONS/Réunion de suivi: Non mentionné dans l'avenant.\n\nObligation du prestataire/Conseil: Non mentionné dans l'avenant.\n\nObligations générales: Les parties conviennent de changer l'article 5, article 6 et d'ajouter un nouvel article concernant les quantités prévisionnelles au titre de l'année 2022 du contrat de vente.\n\nStipulations générales liées à la propriété intellectuelle: Non mentionné dans l'avenant.\n\nObligation de Collaboration: Non mentionné dans l'avenant.\n\nPropriété intellectuelle/Stipulations générales liées à la propriété intellectuelle: Non mentionné dans l'avenant.\n\nPropriété intellectuelle/Droit d’utilisation du Service Hébergé: Non mentionné dans l'avenant."
      },
      "finish_reason": "stop",
      "index": 0
    }
  ]
}
export type chatCompletion = typeof chatCompletionExampleResponse
export type message = { role: "user" | "system", content: string }
export class OpenAIService {
  static async SaveLogToDataBase(messages: message[], completion: chatCompletion, user?: string): Promise<OpenAIResponseLog> {
    const systemPrompt = messages.find(m => m.role == 'system')?.content
    const userPrompt = messages.find(m => m.role == 'user')?.content
    const data: OpenAIResponseLogEntity = {
      id: completion.id,
      user: user,
      object: completion.object,
      created: new Date(completion.created),
      model: completion.model,
      prompt_tokens: completion.usage.prompt_tokens,
      completion_tokens: completion.usage.completion_tokens,
      total_tokens: completion.usage.total_tokens,
      role: completion.choices[0].message.role,
      systemPrompt,
      userPrompt,
      content: completion.choices[0].message.content,
      finish_reason: completion.choices[0].finish_reason,
      index: completion.choices[0].index,
    }
    return await OpenAIResponseLog.create(data as any)
  }
  static async MultiChatCompletion(multiMessages: message[][], user?: string): Promise<chatCompletion[]> {
    try {
      const apiUrl = 'https://api.openai.com/v1/chat/completions';
      if (!user)
        user = randomUUID()
      let completions: chatCompletion[] = []
      for (const messages of multiMessages) {
        const response = await axios.post(apiUrl, {
          user,
          model,
          messages,
          temperature: 0
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        })
        const completion = response.data as chatCompletion
        await this.SaveLogToDataBase(messages, completion, user)
        completions.push(completion)
      }
      return completions

    } catch (error: any) {
      if (error.response?.data) {
        console.error(error.response.status, error.response.data);
        throw error.response.data
      } else {
        console.error(`Error with OpenAI API request: ${error.message}`);
        throw error.message
      }
    }
  }
  static async ChatCompletion(messages: message[], user: string = "", json: boolean = false): Promise<chatCompletion> {
    try {
      if (!user)
        user = randomUUID()
      const apiUrl = 'https://api.openai.com/v1/chat/completions';
      const response = await axios.post(apiUrl, {
        user,
        model,
        ...(json ? { "response_format": { "type": "json_object" } } : {}),
        messages,
        temperature: 0
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      })
      const completion = response.data as chatCompletion
      await this.SaveLogToDataBase(messages, completion, user)
      if (json) {
        const jsonString = completion.choices[0].message.content
        try {
          JSON.parse(jsonString)
        } catch (error) {
          console.error("AI OUTPUT IS NOT JSON");
          console.error(messages);
          console.error(jsonString);
          throw error
        }
      }
      return completion

    } catch (error: any) {
      if (error.response?.data) {
        console.error(error.response.status, error.response.data);
        throw error.response.data
      } else {
        console.error(`Error with OpenAI API request: ${error.message}`);
        throw error.message
      }
    }
  }

}
